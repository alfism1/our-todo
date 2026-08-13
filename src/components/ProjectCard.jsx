import { forwardRef } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { CheckCircle2, Link2, Lock, Trash2 } from 'lucide-react'
import { ProgressBar } from './ProgressBar'
import { hexToRgbTriple, pluralize } from '../lib/utils'

// forwardRef so AnimatePresence's popLayout mode can measure the exiting card.
export const ProjectCard = forwardRef(function ProjectCard(
  { project, stats, onCopyLink, onRemove },
  ref,
) {
  const total = stats?.total ?? 0
  const completed = stats?.completed ?? 0
  const percent = total ? (completed / total) * 100 : 0
  const allDone = total > 0 && completed === total

  return (
    <motion.div
      ref={ref}
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.97 }}
      transition={{ type: 'spring', stiffness: 320, damping: 30 }}
      style={{ '--accent-rgb': hexToRgbTriple(project.color) }}
      className="group relative"
    >
      <Link
        to={`/project/${project.id}`}
        className="card block overflow-hidden p-5 transition-all hover:-translate-y-0.5 hover:shadow-lift"
      >
        <span
          className="absolute inset-x-0 top-0 h-1 bg-accent opacity-80"
          aria-hidden="true"
        />

        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-accent-soft">
            {allDone ? (
              <CheckCircle2 className="h-[18px] w-[18px] text-accent" />
            ) : (
              <span className="h-2.5 w-2.5 rounded-full bg-accent" />
            )}
          </div>

          <div className="min-w-0 flex-1 pr-16">
            <h3 className="flex items-center gap-1.5 truncate font-semibold tracking-tight">
              {project.name}
              {project.passcode && (
                <Lock className="h-3.5 w-3.5 shrink-0 text-ink-400" aria-label="Passcode protected" />
              )}
            </h3>
            <p className="mt-0.5 truncate text-sm text-ink-500 dark:text-ink-400">
              {project.description || (total ? pluralize(total, 'task') : 'No tasks yet')}
            </p>
          </div>
        </div>

        <div className="mt-4 flex items-center gap-3">
          <ProgressBar value={percent} />
          <span className="shrink-0 text-xs font-medium tabular-nums text-ink-400">
            {stats ? `${completed}/${total}` : '—'}
          </span>
        </div>
      </Link>

      {/* Kept outside the Link so these don't navigate */}
      <div className="absolute right-3 top-4 flex items-center gap-0.5 opacity-0 transition-opacity
                      focus-within:opacity-100 group-hover:opacity-100 max-sm:opacity-100">
        <IconAction label="Copy share link" onClick={() => onCopyLink(project)}>
          <Link2 className="h-4 w-4" />
        </IconAction>
        <IconAction label="Remove from this device" onClick={() => onRemove(project)}>
          <Trash2 className="h-4 w-4" />
        </IconAction>
      </div>
    </motion.div>
  )
})

function IconAction({ label, onClick, children }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={(e) => {
        e.preventDefault()
        e.stopPropagation()
        onClick()
      }}
      className="rounded-lg p-2 text-ink-400 transition-colors hover:bg-ink-100 hover:text-ink-800
                 dark:hover:bg-white/10 dark:hover:text-ink-100"
    >
      {children}
    </button>
  )
}
