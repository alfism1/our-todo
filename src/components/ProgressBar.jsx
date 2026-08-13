import { motion } from 'framer-motion'
import { cn } from '../lib/utils'

export function ProgressBar({ value, className, thickness = 'h-1.5' }) {
  return (
    <div
      className={cn(
        'w-full overflow-hidden rounded-full bg-ink-200/80 dark:bg-white/10',
        thickness,
        className,
      )}
      role="progressbar"
      aria-valuenow={Math.round(value)}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <motion.div
        className="h-full rounded-full bg-accent"
        initial={false}
        animate={{ width: `${Math.min(100, Math.max(0, value))}%` }}
        transition={{ type: 'spring', stiffness: 220, damping: 30 }}
      />
    </div>
  )
}
