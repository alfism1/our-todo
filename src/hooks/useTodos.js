import { useEffect, useRef, useState } from 'react'
import { collection, onSnapshot, orderBy, query } from 'firebase/firestore'
import { db } from '../lib/firebase'

const HIGHLIGHT_MS = 1800

/**
 * A single `onSnapshot` on the project's todos powers the whole board — one
 * listener per open project, which keeps read volume predictable on the Spark
 * plan (a listener bills for the initial load plus one read per changed doc).
 *
 * `remoteIds` holds todos a *collaborator* just touched, so the UI can flash
 * them. Telling those apart from our own edits takes two steps, because
 * `hasPendingWrites` alone is not enough: a write containing
 * `serverTimestamp()` lands locally with an estimated time, then lands *again*
 * when the server's real timestamp comes back — and that second snapshot has
 * no pending writes, so it looks exactly like somebody else's edit. So we
 * remember which docs this client has in flight and discard their echo.
 */
export function useTodos(projectId, { enabled = true, onRemoteChange } = {}) {
  const [state, setState] = useState({ todos: [], status: 'loading', error: null })
  const [remoteIds, setRemoteIds] = useState(() => new Set())

  const isFirstSnapshot = useRef(true)
  const pendingIds = useRef(new Set())
  const timers = useRef(new Map())
  const onRemoteChangeRef = useRef(onRemoteChange)
  onRemoteChangeRef.current = onRemoteChange

  useEffect(() => {
    if (!projectId || !enabled) return

    isFirstSnapshot.current = true
    pendingIds.current.clear()
    setState({ todos: [], status: 'loading', error: null })

    const q = query(collection(db, 'projects', projectId, 'todos'), orderBy('order', 'asc'))

    const unsub = onSnapshot(
      q,
      (snap) => {
        const todos = snap.docs.map((d) => ({ id: d.id, ...d.data() }))
        setState({ todos, status: 'ready', error: null })

        // Note anything this client is currently writing, before classifying.
        for (const d of snap.docs) {
          if (d.metadata.hasPendingWrites) pendingIds.current.add(d.id)
        }

        if (isFirstSnapshot.current) {
          isFirstSnapshot.current = false
          return
        }

        const remote = snap.docChanges().filter((c) => {
          if (c.doc.metadata.hasPendingWrites) return false
          if (pendingIds.current.has(c.doc.id)) {
            pendingIds.current.delete(c.doc.id) // our own write, now acked
            return false
          }
          return true
        })

        if (!remote.length) return

        const touched = remote.filter((c) => c.type !== 'removed').map((c) => c.doc.id)
        if (touched.length) {
          setRemoteIds((prev) => new Set([...prev, ...touched]))
          for (const id of touched) {
            clearTimeout(timers.current.get(id))
            timers.current.set(
              id,
              setTimeout(() => {
                timers.current.delete(id)
                setRemoteIds((prev) => {
                  const next = new Set(prev)
                  next.delete(id)
                  return next
                })
              }, HIGHLIGHT_MS),
            )
          }
        }

        onRemoteChangeRef.current?.(remote)
      },
      (error) => setState({ todos: [], status: 'error', error }),
    )

    return () => {
      unsub()
      timers.current.forEach(clearTimeout)
      timers.current.clear()
      pendingIds.current.clear()
      setRemoteIds(new Set())
    }
  }, [projectId, enabled])

  return { ...state, remoteIds }
}
