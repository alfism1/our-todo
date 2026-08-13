import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  documentId,
  getCountFromServer,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  writeBatch,
} from 'firebase/firestore'
import { db } from './firebase'
import { chunk } from './utils'

export const ORDER_STEP = 1000

const projectsCol = () => collection(db, 'projects')
const todosCol = (projectId) => collection(db, 'projects', projectId, 'todos')
export const projectRef = (projectId) => doc(db, 'projects', projectId)
export const todoRef = (projectId, todoId) => doc(db, 'projects', projectId, 'todos', todoId)

/* ---------------------------------- Projects --------------------------------- */

export async function createProject({ name, description = '', passcode = null, color, ownerId }) {
  const ref = await addDoc(projectsCol(), {
    name: name.trim(),
    description: description.trim(),
    passcode: passcode?.trim() || null,
    color,
    createdAt: serverTimestamp(),
    ownerId,
  })
  return ref.id
}

export async function updateProject(projectId, patch) {
  await updateDoc(projectRef(projectId), patch)
}

export async function fetchProject(projectId) {
  const snap = await getDoc(projectRef(projectId))
  return snap.exists() ? { id: snap.id, ...snap.data() } : null
}

/**
 * Home-page list. The device only knows project *ids* (localStorage), so we
 * fetch them with `in` queries — 1 read per project but batched into as few
 * round-trips as Firestore allows (30 ids per `in` clause).
 */
export async function fetchProjectsByIds(ids) {
  if (!ids.length) return []
  const groups = await Promise.all(
    chunk(ids, 30).map((group) => getDocs(query(projectsCol(), where(documentId(), 'in', group)))),
  )
  const found = new Map()
  for (const snap of groups) {
    snap.forEach((d) => found.set(d.id, { id: d.id, ...d.data() }))
  }
  // Preserve the caller's ordering (most recently opened first).
  return ids.map((id) => found.get(id)).filter(Boolean)
}

/**
 * Progress for the Home cards. Aggregation queries bill one read per 1000
 * index entries scanned rather than one per document, so this stays cheap
 * even for a long list — pulling every todo doc just to count them would not.
 */
export async function fetchProjectStats(projectId) {
  const col = todosCol(projectId)
  const [total, done] = await Promise.all([
    getCountFromServer(col),
    getCountFromServer(query(col, where('completed', '==', true))),
  ])
  return { total: total.data().count, completed: done.data().count }
}

/**
 * Firestore has no recursive delete on the client, so the subcollection has to
 * be cleared explicitly — otherwise the todos linger as orphans and keep
 * counting against storage. Batches cap at 500 writes.
 */
export async function deleteProject(projectId) {
  const todos = await getDocs(todosCol(projectId))
  const docs = todos.docs
  for (const group of chunk(docs, 400)) {
    const batch = writeBatch(db)
    group.forEach((d) => batch.delete(d.ref))
    await batch.commit()
  }
  await deleteDoc(projectRef(projectId))
}

/* ----------------------------------- Todos ----------------------------------- */

export async function createTodo(projectId, { title, order, createdBy, ...rest }) {
  const ref = await addDoc(todosCol(projectId), {
    title: title.trim(),
    notes: '',
    completed: false,
    priority: 'medium',
    dueDate: null,
    reminderAt: null,
    tags: [],
    subtasks: [],
    order,
    createdBy,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    ...rest,
  })
  return ref.id
}

export async function updateTodo(projectId, todoId, patch) {
  await updateDoc(todoRef(projectId, todoId), { ...patch, updatedAt: serverTimestamp() })
}

export async function deleteTodo(projectId, todoId) {
  await deleteDoc(todoRef(projectId, todoId))
}

/** Restores a deleted todo under its original id, for undo-from-toast. */
export async function restoreTodo(projectId, todo) {
  const { id, ...data } = todo
  await setDoc(todoRef(projectId, id), data)
}

export async function deleteCompletedTodos(projectId, todos) {
  for (const group of chunk(todos, 400)) {
    const batch = writeBatch(db)
    group.forEach((t) => batch.delete(todoRef(projectId, t.id)))
    await batch.commit()
  }
}

/* --------------------------------- Ordering ---------------------------------- */

/**
 * Fractional ordering: a todo dropped between two others takes the midpoint of
 * their `order` values, so a drag costs exactly one write no matter how long
 * the list is. Rewriting every row instead would burn through the Spark plan's
 * 20K daily writes very quickly.
 *
 * The tradeoff is float precision — repeatedly dropping into the same gap
 * halves it each time. `needsRebalance` detects that and `rebalanceOrders`
 * spreads everything back out (the one case where we do pay for N writes).
 */
export function orderBetween(before, after) {
  if (before == null && after == null) return ORDER_STEP
  if (before == null) return after - ORDER_STEP
  if (after == null) return before + ORDER_STEP
  return (before + after) / 2
}

const MIN_GAP = 0.0001

export function needsRebalance(orderedTodos) {
  for (let i = 1; i < orderedTodos.length; i++) {
    if (Math.abs(orderedTodos[i].order - orderedTodos[i - 1].order) < MIN_GAP) return true
  }
  return false
}

export async function rebalanceOrders(projectId, orderedTodos) {
  for (const [groupIndex, group] of chunk(orderedTodos, 400).entries()) {
    const batch = writeBatch(db)
    group.forEach((todo, i) => {
      const order = (groupIndex * 400 + i + 1) * ORDER_STEP
      batch.update(todoRef(projectId, todo.id), { order })
    })
    await batch.commit()
  }
}

/** Order value that puts a new todo at the top of the list. */
export function orderForNewTodo(orderedTodos) {
  const first = orderedTodos[0]
  return first ? first.order - ORDER_STEP : ORDER_STEP
}
