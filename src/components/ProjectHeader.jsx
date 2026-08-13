import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import {
  ArrowLeft,
  Eraser,
  Lock,
  MoreVertical,
  Settings2,
  Share2,
  Trash2,
} from 'lucide-react'
import { ProgressBar } from './ProgressBar'
import { ThemeToggle } from './ThemeToggle'
import { pluralize } from '../lib/utils'

export function ProjectHeader({
  project,
  total,
  completed,
  onShare,
  onSettings,
  onDelete,
  onClearCompleted,
}) {
  const percent = total ? (completed / total) * 100 : 0

  return (
    <div className="sticky top-0 z-30 border-b border-ink-200/70 bg-ink-50/85 backdrop-blur-md
                    dark:border-white/10 dark:bg-ink-950/85">
      <div className="mx-auto w-full max-w-3xl px-4 pb-3 pt-3 sm:px-6 sm:pb-4 sm:pt-4">
        <div className="flex items-center gap-2">
          <Link
            to="/"
            aria-label="All projects"
            className="-ml-2 rounded-xl p-2 text-ink-500 transition-colors hover:bg-ink-100
                       hover:text-ink-900 dark:hover:bg-white/5 dark:hover:text-ink-100"
          >
            <ArrowLeft className="h-[18px] w-[18px]" />
          </Link>

          <div className="min-w-0 flex-1">
            <h1 className="flex items-center gap-1.5 truncate text-lg font-semibold tracking-tight">
              <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-accent" aria-hidden="true" />
              <span className="truncate">{project.name}</span>
              {project.passcode && (
                <Lock className="h-3.5 w-3.5 shrink-0 text-ink-400" aria-label="Passcode protected" />
              )}
            </h1>
            {project.description && (
              <p className="truncate text-sm text-ink-500 dark:text-ink-400">
                {project.description}
              </p>
            )}
          </div>

          <button type="button" onClick={onShare} className="btn-primary !px-3 !py-2">
            <Share2 className="h-4 w-4" />
            <span className="max-sm:sr-only">Share</span>
          </button>

          <ThemeToggle />

          <OverflowMenu
            items={[
              { icon: Settings2, label: 'Project settings', onClick: onSettings },
              {
                icon: Eraser,
                label: 'Clear completed',
                onClick: onClearCompleted,
                disabled: completed === 0,
              },
              { icon: Trash2, label: 'Delete project', onClick: onDelete, danger: true },
            ]}
          />
        </div>

        <div className="mt-3 flex items-center gap-3">
          <ProgressBar value={percent} />
          <span className="shrink-0 text-xs font-medium tabular-nums text-ink-500 dark:text-ink-400">
            {total === 0
              ? 'No tasks'
              : completed === total
                ? 'All done 🎉'
                : `${completed}/${total} · ${pluralize(total - completed, 'task')} left`}
          </span>
        </div>
      </div>
    </div>
  )
}

function OverflowMenu({ items }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    if (!open) return
    const onDown = (e) => !ref.current?.contains(e.target) && setOpen(false)
    const onKey = (e) => e.key === 'Escape' && setOpen(false)
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="More options"
        aria-expanded={open}
        className="flex h-9 w-9 items-center justify-center rounded-xl text-ink-500 transition-colors
                   hover:bg-ink-100 hover:text-ink-900 dark:hover:bg-white/5 dark:hover:text-ink-100"
      >
        <MoreVertical className="h-[18px] w-[18px]" />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -4 }}
            transition={{ duration: 0.13 }}
            className="absolute right-0 top-11 z-40 w-52 origin-top-right overflow-hidden rounded-xl
                       border border-ink-200/70 bg-white p-1 shadow-lift dark:border-white/10 dark:bg-ink-900"
          >
            {items.map(({ icon: Icon, label, onClick, danger, disabled }) => (
              <button
                key={label}
                type="button"
                disabled={disabled}
                onClick={() => {
                  setOpen(false)
                  onClick()
                }}
                className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm
                            transition-colors disabled:pointer-events-none disabled:opacity-40 ${
                              danger
                                ? 'text-rose-600 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-500/10'
                                : 'text-ink-700 hover:bg-ink-100 dark:text-ink-200 dark:hover:bg-white/5'
                            }`}
              >
                <Icon className="h-4 w-4" />
                {label}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
