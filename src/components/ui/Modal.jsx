import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { X } from 'lucide-react'

export function Modal({ open, onClose, title, description, children, size = 'md' }) {
  useEffect(() => {
    if (!open) return
    const onKey = (e) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    // Prevent the page behind the sheet from scrolling on touch devices.
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = previous
    }
  }, [open, onClose])

  const maxWidth = { sm: 'max-w-sm', md: 'max-w-lg', lg: 'max-w-2xl' }[size]

  return createPortal(
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
          <motion.div
            className="absolute inset-0 bg-ink-950/40 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            onClick={onClose}
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={title}
            className={`relative flex max-h-[92vh] w-full flex-col overflow-hidden rounded-t-3xl
                        bg-white shadow-lift dark:bg-ink-900 sm:rounded-3xl ${maxWidth}`}
            initial={{ opacity: 0, y: 24, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.98 }}
            transition={{ type: 'spring', stiffness: 380, damping: 30 }}
          >
            <div className="flex items-start justify-between gap-4 px-6 pb-2 pt-6">
              <div className="min-w-0">
                <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
                {description && (
                  <p className="mt-1 text-sm text-ink-500 dark:text-ink-400">{description}</p>
                )}
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close"
                className="-mr-2 -mt-1 rounded-lg p-2 text-ink-400 transition-colors hover:bg-ink-100
                           hover:text-ink-700 dark:hover:bg-white/5 dark:hover:text-ink-200"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="overflow-y-auto px-6 pb-6 pt-2">{children}</div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body,
  )
}
