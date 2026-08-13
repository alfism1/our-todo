import { AnimatePresence, motion } from 'framer-motion'
import { Moon, Sun } from 'lucide-react'
import { useTheme } from '../lib/ThemeProvider'

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme()
  const dark = theme === 'dark'

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'}
      className="relative flex h-9 w-9 items-center justify-center overflow-hidden rounded-xl
                 text-ink-500 transition-colors hover:bg-ink-100 hover:text-ink-800
                 dark:text-ink-400 dark:hover:bg-white/5 dark:hover:text-ink-100"
    >
      <AnimatePresence initial={false} mode="wait">
        <motion.span
          key={theme}
          initial={{ y: 14, opacity: 0, rotate: -30 }}
          animate={{ y: 0, opacity: 1, rotate: 0 }}
          exit={{ y: -14, opacity: 0, rotate: 30 }}
          transition={{ duration: 0.18 }}
          className="absolute"
        >
          {dark ? <Moon className="h-[18px] w-[18px]" /> : <Sun className="h-[18px] w-[18px]" />}
        </motion.span>
      </AnimatePresence>
    </button>
  )
}
