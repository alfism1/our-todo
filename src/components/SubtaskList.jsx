import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Plus, X } from 'lucide-react'
import { Checkbox } from './Checkbox'
import { cn, uid } from '../lib/utils'

export function SubtaskList({ subtasks = [], onChange, autoFocusInput = false }) {
  const [draft, setDraft] = useState('')

  function add() {
    const title = draft.trim()
    if (!title) return
    onChange([...subtasks, { id: uid('st_'), title, completed: false }])
    setDraft('')
  }

  function toggle(id, completed) {
    onChange(subtasks.map((s) => (s.id === id ? { ...s, completed } : s)))
  }

  return (
    <div className="space-y-1">
      <AnimatePresence initial={false}>
        {subtasks.map((subtask) => (
          <motion.div
            key={subtask.id}
            layout
            initial={{ opacity: 0, x: -6 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -6 }}
            transition={{ duration: 0.16 }}
            className="group/sub flex items-center gap-2.5 rounded-lg px-1 py-1.5
                       hover:bg-ink-100/60 dark:hover:bg-white/5"
          >
            <Checkbox
              size="sm"
              checked={subtask.completed}
              onChange={(next) => toggle(subtask.id, next)}
              label={subtask.title}
            />
            <span
              className={cn(
                'flex-1 text-sm transition-colors',
                subtask.completed && 'text-ink-400 line-through dark:text-ink-500',
              )}
            >
              {subtask.title}
            </span>
            <button
              type="button"
              onClick={() => onChange(subtasks.filter((s) => s.id !== subtask.id))}
              aria-label={`Delete subtask ${subtask.title}`}
              className="rounded-md p-1 text-ink-300 opacity-0 transition-opacity hover:text-rose-500
                         focus-visible:opacity-100 group-hover/sub:opacity-100 max-sm:opacity-100"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>

      {/* Not a <form>: this renders inside the task editor's form, and nested
          forms make Enter fall through to a native submit. */}
      <div className="flex items-center gap-2.5 px-1 pt-0.5">
        <Plus className="h-[18px] w-[18px] shrink-0 text-ink-300 dark:text-ink-600" />
        <input
          className="flex-1 bg-transparent py-1 text-sm outline-none placeholder:text-ink-400"
          placeholder="Add a step…"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key !== 'Enter') return
            e.preventDefault()
            add()
          }}
          onBlur={add}
          autoFocus={autoFocusInput}
          maxLength={120}
          aria-label="New subtask"
        />
      </div>
    </div>
  )
}
