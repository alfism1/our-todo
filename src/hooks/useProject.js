import { useEffect, useState } from 'react'
import { onSnapshot } from 'firebase/firestore'
import { projectRef } from '../lib/db'

/**
 * One live listener on the project doc, so a rename or color change by a
 * collaborator shows up for everyone without a refresh.
 */
export function useProject(projectId) {
  const [state, setState] = useState({ project: null, status: 'loading', error: null })

  useEffect(() => {
    if (!projectId) return
    setState({ project: null, status: 'loading', error: null })

    return onSnapshot(
      projectRef(projectId),
      (snap) => {
        setState(
          snap.exists()
            ? { project: { id: snap.id, ...snap.data() }, status: 'ready', error: null }
            : { project: null, status: 'missing', error: null },
        )
      },
      (error) => setState({ project: null, status: 'error', error }),
    )
  }, [projectId])

  return state
}
