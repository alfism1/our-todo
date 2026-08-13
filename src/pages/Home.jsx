import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import toast from 'react-hot-toast'
import { ListTodo, Plus } from 'lucide-react'
import { ProjectCard } from '../components/ProjectCard'
import { ProjectFormModal } from '../components/ProjectFormModal'
import { ConfirmDialog } from '../components/ui/ConfirmDialog'
import { EmptyState } from '../components/ui/EmptyState'
import { ProjectCardSkeleton } from '../components/ui/Skeletons'
import { ThemeToggle } from '../components/ThemeToggle'
import { createProject, fetchProjectStats, fetchProjectsByIds } from '../lib/db'
import { forgetProject, getKnownProjects, rememberProject } from '../lib/localStore'
import { useAuth } from '../lib/AuthProvider'
import { copyShareLink } from '../lib/share'

export function Home() {
  const navigate = useNavigate()
  const { uid, status: authStatus } = useAuth()

  const [projects, setProjects] = useState([])
  const [stats, setStats] = useState({})
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [removing, setRemoving] = useState(null)

  const load = useCallback(async () => {
    const ids = getKnownProjects().map((p) => p.id)
    if (!ids.length) {
      setProjects([])
      setLoading(false)
      return
    }
    try {
      const found = await fetchProjectsByIds(ids)
      setProjects(found)

      // Projects deleted by their owner stay in localStorage forever otherwise.
      const foundIds = new Set(found.map((p) => p.id))
      ids.filter((id) => !foundIds.has(id)).forEach(forgetProject)

      const entries = await Promise.all(
        found.map(async (p) => {
          try {
            return [p.id, await fetchProjectStats(p.id)]
          } catch {
            return [p.id, null]
          }
        }),
      )
      setStats(Object.fromEntries(entries.filter(([, v]) => v)))
    } catch (err) {
      console.error(err)
      toast.error("Couldn't load your projects")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (authStatus === 'ready') load()
  }, [authStatus, load])

  async function handleCreate(values) {
    const id = await createProject({ ...values, ownerId: uid })
    rememberProject(id)
    toast.success('Project created')
    navigate(`/project/${id}`)
  }

  function handleRemove() {
    forgetProject(removing.id)
    setProjects((list) => list.filter((p) => p.id !== removing.id))
    setRemoving(null)
    toast.success('Removed from this device')
  }

  const busy = loading || authStatus === 'loading'

  return (
    <div className="mx-auto w-full max-w-3xl px-4 pb-24 pt-6 sm:px-6 sm:pt-10">
      <header className="mb-8 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Our Todo</h1>
          <p className="mt-1 text-sm text-ink-500 dark:text-ink-400">
            Shared lists. One link, no signup.
          </p>
        </div>
        <div className="flex items-center gap-1">
          <ThemeToggle />
        </div>
      </header>

      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-sm font-medium text-ink-500 dark:text-ink-400">
          {busy ? 'Your projects' : `Your projects · ${projects.length}`}
        </h2>
        <button type="button" className="btn-primary !py-2" onClick={() => setCreating(true)}>
          <Plus className="h-4 w-4" />
          New project
        </button>
      </div>

      {busy ? (
        <div className="space-y-3">
          <ProjectCardSkeleton />
          <ProjectCardSkeleton />
          <ProjectCardSkeleton />
        </div>
      ) : projects.length === 0 ? (
        <div className="card">
          <EmptyState
            icon={ListTodo}
            title="No projects yet"
            message="Create your first list, then send the link to whoever should be on it. They won't need an account."
            action={
              <button type="button" className="btn-primary" onClick={() => setCreating(true)}>
                <Plus className="h-4 w-4" />
                Create a project
              </button>
            }
          />
        </div>
      ) : (
        <motion.div layout className="space-y-3">
          <AnimatePresence mode="popLayout">
            {projects.map((project) => (
              <ProjectCard
                key={project.id}
                project={project}
                stats={stats[project.id]}
                onCopyLink={(p) => copyShareLink(p.id)}
                onRemove={setRemoving}
              />
            ))}
          </AnimatePresence>
        </motion.div>
      )}

      {!busy && projects.length > 0 && (
        <p className="mt-6 px-1 text-xs leading-relaxed text-ink-400">
          This list lives on this device only. Keep the links — opening one adds the project back.
        </p>
      )}

      <ProjectFormModal
        open={creating}
        onClose={() => setCreating(false)}
        onSubmit={handleCreate}
      />

      <ConfirmDialog
        open={Boolean(removing)}
        onClose={() => setRemoving(null)}
        onConfirm={handleRemove}
        title="Remove from this device?"
        message={`"${removing?.name}" stays live for everyone else with the link — this only clears it from your list here. Delete it for good from inside the project.`}
        confirmLabel="Remove"
      />
    </div>
  )
}
