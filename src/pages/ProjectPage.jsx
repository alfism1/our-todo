import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { arrayMove } from '@dnd-kit/sortable'
import toast from 'react-hot-toast'
import { CircleSlash, Inbox, ListTodo, SearchX } from 'lucide-react'
import { ProjectHeader } from '../components/ProjectHeader'
import { TodoComposer } from '../components/TodoComposer'
import { TodoList } from '../components/TodoList'
import { TodoEditor } from '../components/TodoEditor'
import { FilterBar } from '../components/FilterBar'
import { PasscodeGate } from '../components/PasscodeGate'
import { ProjectFormModal } from '../components/ProjectFormModal'
import { ConfirmDialog } from '../components/ui/ConfirmDialog'
import { EmptyState } from '../components/ui/EmptyState'
import { TodoListSkeleton } from '../components/ui/Skeletons'
import { Confetti } from '../components/ui/Confetti'
import { useProject } from '../hooks/useProject'
import { useTodos } from '../hooks/useTodos'
import { useDebounced } from '../hooks/useDebounced'
import { useAccentColor } from '../hooks/useAccentColor'
import { useAuth } from '../lib/AuthProvider'
import {
  createTodo,
  deleteCompletedTodos,
  deleteProject,
  deleteTodo,
  needsRebalance,
  orderBetween,
  orderForNewTodo,
  rebalanceOrders,
  restoreTodo,
  updateProject,
  updateTodo,
} from '../lib/db'
import { forgetProject, isUnlocked, rememberProject } from '../lib/localStore'
import { scheduleReminders } from '../lib/reminders'
import { shareProject } from '../lib/share'
import { PRIORITY_RANK, toDate } from '../lib/utils'

const DEFAULT_FILTERS = {
  status: 'all',
  priority: 'all',
  tag: '',
  search: '',
  sort: 'manual',
}

export function ProjectPage() {
  const { projectId } = useParams()
  const navigate = useNavigate()
  const { uid, status: authStatus } = useAuth()

  const { project, status: projectStatus } = useProject(
    authStatus === 'ready' ? projectId : null,
  )

  const [unlocked, setUnlocked] = useState(() => isUnlocked(projectId))
  const isOwner = Boolean(project && uid && project.ownerId === uid)
  const gated = Boolean(project?.passcode) && !unlocked && !isOwner

  const [filters, setFilters] = useState(DEFAULT_FILTERS)
  const search = useDebounced(filters.search, 250).trim().toLowerCase()

  const [editing, setEditing] = useState(null)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [confirm, setConfirm] = useState(null) // 'delete-project' | 'clear-completed'
  const [busy, setBusy] = useState(false)
  const [confettiKey, setConfettiKey] = useState(0)

  useAccentColor(project?.color)

  const onRemoteChange = useCallback((changes) => {
    const added = changes.filter((c) => c.type === 'added').length
    const removed = changes.filter((c) => c.type === 'removed').length
    const label =
      added && !removed
        ? `${added} new task${added > 1 ? 's' : ''} from a collaborator`
        : removed && !added
          ? `${removed} task${removed > 1 ? 's' : ''} removed by a collaborator`
          : 'Updated by a collaborator'
    // One toast id, so a burst of changes replaces rather than stacks.
    toast(label, { id: 'remote-sync', icon: '🔄' })
  }, [])

  const {
    todos,
    status: todosStatus,
    remoteIds,
  } = useTodos(projectId, { enabled: !gated && projectStatus === 'ready', onRemoteChange })

  // Adds the project to this device's Home list — the only record that it exists.
  useEffect(() => {
    if (projectStatus === 'ready' && !gated) rememberProject(projectId)
  }, [projectStatus, gated, projectId])

  /* ------------------------------- derived data ------------------------------ */

  const completedCount = useMemo(() => todos.filter((t) => t.completed).length, [todos])

  const allTags = useMemo(
    () => [...new Set(todos.flatMap((t) => t.tags ?? []))].sort(),
    [todos],
  )

  const counts = useMemo(
    () => ({
      all: todos.length,
      active: todos.length - completedCount,
      completed: completedCount,
    }),
    [todos.length, completedCount],
  )

  const visible = useMemo(() => {
    let list = todos

    if (filters.status === 'active') list = list.filter((t) => !t.completed)
    else if (filters.status === 'completed') list = list.filter((t) => t.completed)

    if (filters.priority !== 'all') {
      list = list.filter((t) => (t.priority ?? 'medium') === filters.priority)
    }
    if (filters.tag) list = list.filter((t) => t.tags?.includes(filters.tag))
    if (search) {
      list = list.filter((t) =>
        `${t.title} ${t.notes ?? ''}`.toLowerCase().includes(search),
      )
    }

    if (filters.sort === 'manual') return list // already ordered by the query

    const sorted = [...list]
    if (filters.sort === 'priority') {
      sorted.sort(
        (a, b) =>
          PRIORITY_RANK[a.priority ?? 'medium'] - PRIORITY_RANK[b.priority ?? 'medium'] ||
          a.order - b.order,
      )
    } else if (filters.sort === 'dueDate') {
      // Undated tasks sink to the bottom instead of sorting as epoch 0.
      sorted.sort((a, b) => {
        const av = toDate(a.dueDate)?.getTime() ?? Infinity
        const bv = toDate(b.dueDate)?.getTime() ?? Infinity
        return av - bv || a.order - b.order
      })
    } else if (filters.sort === 'created') {
      sorted.sort(
        (a, b) => (toDate(b.createdAt)?.getTime() ?? 0) - (toDate(a.createdAt)?.getTime() ?? 0),
      )
    }
    return sorted
  }, [todos, filters.status, filters.priority, filters.tag, filters.sort, search])

  const filtering =
    filters.status !== 'all' || filters.priority !== 'all' || Boolean(filters.tag) || Boolean(search)

  // Reordering only makes sense against the full, manually-ordered list —
  // dropping between two rows while others are hidden would write a position
  // relative to neighbours the dragger can't see.
  const dragEnabled = filters.sort === 'manual' && !filtering

  /* --------------------------------- effects -------------------------------- */

  useEffect(() => {
    if (todosStatus !== 'ready') return
    return scheduleReminders(todos, {
      projectName: project?.name,
      onFire: (todo) => toast(todo.title, { icon: '⏰', duration: 6000 }),
    })
  }, [todos, todosStatus, project?.name])

  const wasAllDone = useRef(false)
  useEffect(() => {
    if (todosStatus !== 'ready') return
    const allDone = todos.length > 0 && completedCount === todos.length
    // Only on the transition into 100%, not on every render while sitting there.
    if (allDone && !wasAllDone.current) setConfettiKey((k) => k + 1)
    wasAllDone.current = allDone
  }, [todos.length, completedCount, todosStatus])

  /* -------------------------------- handlers -------------------------------- */

  async function handleAdd({ title, priority }) {
    await createTodo(projectId, {
      title,
      priority,
      order: orderForNewTodo(todos),
      createdBy: uid,
    })
  }

  function handleToggle(todo, completed) {
    updateTodo(projectId, todo.id, { completed }).catch(() => toast.error("Couldn't save"))
  }

  function handleSubtasksChange(todo, subtasks) {
    updateTodo(projectId, todo.id, { subtasks }).catch(() => toast.error("Couldn't save"))
  }

  async function handleDelete(todo) {
    await deleteTodo(projectId, todo.id)
    toast(
      (t) => (
        <span className="flex items-center gap-3">
          <span className="text-sm">Task deleted</span>
          <button
            type="button"
            className="text-sm font-semibold text-accent"
            onClick={() => {
              toast.dismiss(t.id)
              restoreTodo(projectId, todo).catch(() => toast.error("Couldn't undo"))
            }}
          >
            Undo
          </button>
        </span>
      ),
      { duration: 5000 },
    )
  }

  function handleReorder(activeId, overId) {
    const oldIndex = visible.findIndex((t) => t.id === activeId)
    const newIndex = visible.findIndex((t) => t.id === overId)
    if (oldIndex < 0 || newIndex < 0) return

    const moved = arrayMove(visible, oldIndex, newIndex)
    const order = orderBetween(moved[newIndex - 1]?.order ?? null, moved[newIndex + 1]?.order ?? null)

    updateTodo(projectId, activeId, { order }).catch(() => toast.error("Couldn't reorder"))

    const next = moved.map((t) => (t.id === activeId ? { ...t, order } : t))
    if (needsRebalance(next)) rebalanceOrders(projectId, next).catch(() => {})
  }

  async function handleSaveTodo(patch) {
    await updateTodo(projectId, editing.id, patch)
    toast.success('Saved')
  }

  async function handleSaveProject(patch) {
    await updateProject(projectId, patch)
    toast.success('Project updated')
  }

  async function handleClearCompleted() {
    setBusy(true)
    try {
      await deleteCompletedTodos(projectId, todos.filter((t) => t.completed))
      toast.success('Completed tasks cleared')
      setConfirm(null)
    } catch {
      toast.error("Couldn't clear tasks")
    } finally {
      setBusy(false)
    }
  }

  async function handleDeleteProject() {
    setBusy(true)
    try {
      await deleteProject(projectId)
      forgetProject(projectId)
      toast.success('Project deleted')
      navigate('/')
    } catch {
      toast.error("Couldn't delete project")
      setBusy(false)
    }
  }

  /* ------------------------------- render gates ------------------------------ */

  if (projectStatus === 'loading' || authStatus === 'loading') {
    return <ProjectSkeleton />
  }

  if (projectStatus === 'missing') {
    return (
      <CenteredNotice
        icon={CircleSlash}
        title="Project not found"
        message="This link is wrong, or the project was deleted by whoever created it."
      />
    )
  }

  if (projectStatus === 'error' || !project) {
    return (
      <CenteredNotice
        icon={CircleSlash}
        title="Couldn't open this project"
        message="Check your connection, and that Firestore rules are deployed for this project."
      />
    )
  }

  if (gated) {
    return <PasscodeGate project={project} onUnlock={() => setUnlocked(true)} />
  }

  /* ---------------------------------- render --------------------------------- */

  return (
    <div className="min-h-full">
      <ProjectHeader
        project={project}
        total={todos.length}
        completed={completedCount}
        onShare={() => shareProject(projectId, project.name)}
        onSettings={() => setSettingsOpen(true)}
        onDelete={() => setConfirm('delete-project')}
        onClearCompleted={() => setConfirm('clear-completed')}
      />

      <div className="mx-auto w-full max-w-3xl space-y-4 px-4 pb-28 pt-4 sm:px-6">
        <TodoComposer onAdd={handleAdd} />

        {todos.length > 0 && (
          <FilterBar filters={filters} onChange={setFilters} allTags={allTags} counts={counts} />
        )}

        {todosStatus === 'loading' ? (
          <TodoListSkeleton />
        ) : todos.length === 0 ? (
          <div className="card">
            <EmptyState
              icon={Inbox}
              title="Nothing here yet"
              message="Add the first task above, then send the share link to whoever else is on this."
            />
          </div>
        ) : visible.length === 0 ? (
          <div className="card">
            <EmptyState
              icon={filtering ? SearchX : ListTodo}
              title={filtering ? 'No matches' : 'All clear'}
              message={
                filtering
                  ? 'Nothing fits these filters. Try widening them.'
                  : 'Every task here is done.'
              }
              action={
                filtering && (
                  <button
                    type="button"
                    className="btn-outline"
                    onClick={() => setFilters(DEFAULT_FILTERS)}
                  >
                    Clear filters
                  </button>
                )
              }
            />
          </div>
        ) : (
          <>
            <TodoList
              todos={visible}
              dragEnabled={dragEnabled}
              onReorder={handleReorder}
              remoteIds={remoteIds}
              handlers={{
                onToggle: handleToggle,
                onEdit: setEditing,
                onDelete: handleDelete,
                onSubtasksChange: handleSubtasksChange,
                onTagClick: (tag) =>
                  setFilters((f) => ({ ...f, tag: f.tag === tag ? '' : tag })),
              }}
            />
            {!dragEnabled && (
              <p className="px-1 text-center text-xs text-ink-400">
                Switch to manual order with no filters to drag tasks around.
              </p>
            )}
          </>
        )}
      </div>

      <TodoEditor
        open={Boolean(editing)}
        todo={editing}
        onClose={() => setEditing(null)}
        onSave={handleSaveTodo}
        onDelete={() => editing && handleDelete(editing)}
        tagSuggestions={allTags}
      />

      <ProjectFormModal
        open={settingsOpen}
        project={project}
        onClose={() => setSettingsOpen(false)}
        onSubmit={handleSaveProject}
      />

      <ConfirmDialog
        open={confirm === 'delete-project'}
        onClose={() => setConfirm(null)}
        onConfirm={handleDeleteProject}
        busy={busy}
        title="Delete this project?"
        message={`"${project.name}" and all ${todos.length} of its tasks are removed for everyone with the link. This can't be undone.`}
        confirmLabel="Delete forever"
      />

      <ConfirmDialog
        open={confirm === 'clear-completed'}
        onClose={() => setConfirm(null)}
        onConfirm={handleClearCompleted}
        busy={busy}
        title="Clear completed tasks?"
        message={`${completedCount} completed task${completedCount === 1 ? '' : 's'} will be deleted for everyone.`}
        confirmLabel="Clear them"
      />

      <Confetti trigger={confettiKey} />
    </div>
  )
}

function ProjectSkeleton() {
  return (
    <div className="mx-auto w-full max-w-3xl px-4 pt-4 sm:px-6">
      <div className="flex items-center gap-3">
        <div className="skeleton h-8 w-8 rounded-xl" />
        <div className="skeleton h-5 w-40" />
      </div>
      <div className="skeleton mt-4 h-1.5 w-full rounded-full" />
      <div className="skeleton mt-6 h-[52px] w-full rounded-2xl" />
      <div className="mt-4">
        <TodoListSkeleton />
      </div>
    </div>
  )
}

function CenteredNotice({ icon: Icon, title, message }) {
  return (
    <div className="flex min-h-[80vh] items-center justify-center px-4">
      <div className="card max-w-sm px-6 py-10 text-center">
        <div className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-ink-100 dark:bg-white/5">
          <Icon className="h-5 w-5 text-ink-400" />
        </div>
        <h1 className="text-lg font-semibold tracking-tight">{title}</h1>
        <p className="mt-1.5 text-sm leading-relaxed text-ink-500 dark:text-ink-400">{message}</p>
        <Link to="/" className="btn-outline mt-6">
          Back to your projects
        </Link>
      </div>
    </div>
  )
}
