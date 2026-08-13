import { motion } from 'framer-motion'
import { cn } from '../lib/utils'

/**
 * The tick is an SVG path animated by `pathLength`, which is what gives the
 * check its drawn-on feel instead of just appearing.
 */
export function Checkbox({ checked, onChange, label, size = 'md', className }) {
  const box = size === 'sm' ? 'h-[18px] w-[18px]' : 'h-5 w-5'

  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      aria-label={label}
      onClick={(e) => {
        e.stopPropagation()
        onChange(!checked)
      }}
      className={cn(
        'group relative flex shrink-0 items-center justify-center rounded-[7px] border-2 transition-colors',
        box,
        checked
          ? 'border-accent bg-accent'
          : 'border-ink-300 hover:border-accent dark:border-ink-600 dark:hover:border-accent',
        className,
      )}
    >
      <motion.svg
        viewBox="0 0 24 24"
        fill="none"
        className="h-3.5 w-3.5"
        initial={false}
        animate={{ opacity: checked ? 1 : 0 }}
        transition={{ duration: 0.12 }}
      >
        <motion.path
          d="M5 12.5l4.5 4.5L19 7"
          stroke="white"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={false}
          animate={{ pathLength: checked ? 1 : 0 }}
          transition={{ duration: 0.22, ease: 'easeOut' }}
        />
      </motion.svg>
    </button>
  )
}
