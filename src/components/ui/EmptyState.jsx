import { motion } from 'framer-motion'

export function EmptyState({ icon: Icon, title, message, action }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="flex flex-col items-center justify-center px-6 py-16 text-center"
    >
      {Icon && (
        <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-accent-soft">
          <Icon className="h-6 w-6 text-accent" />
        </div>
      )}
      <h3 className="text-base font-semibold tracking-tight">{title}</h3>
      <p className="mt-1.5 max-w-xs text-sm leading-relaxed text-ink-500 dark:text-ink-400">
        {message}
      </p>
      {action && <div className="mt-6">{action}</div>}
    </motion.div>
  )
}
