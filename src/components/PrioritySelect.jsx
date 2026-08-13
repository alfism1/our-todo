import { motion } from 'framer-motion'
import { cn, PRIORITIES, PRIORITY_DOTS } from '../lib/utils'

export function PrioritySelect({ value, onChange }) {
  return (
    <div className="flex gap-1 rounded-xl bg-ink-100 p-1 dark:bg-white/5" role="radiogroup">
      {PRIORITIES.map((priority) => {
        const active = value === priority
        return (
          <button
            key={priority}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(priority)}
            className={cn(
              'relative flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-sm',
              'font-medium capitalize transition-colors',
              active ? 'text-ink-900 dark:text-ink-50' : 'text-ink-500 hover:text-ink-700 dark:hover:text-ink-300',
            )}
          >
            {active && (
              <motion.span
                layoutId="priority-pill"
                className="absolute inset-0 rounded-lg bg-white shadow-sm dark:bg-ink-800"
                transition={{ type: 'spring', stiffness: 420, damping: 34 }}
              />
            )}
            <span className={cn('relative h-2 w-2 rounded-full', PRIORITY_DOTS[priority])} />
            <span className="relative">{priority}</span>
          </button>
        )
      })}
    </div>
  )
}
