import { useState } from 'react'
import { motion } from 'framer-motion'
import { ArrowRight, Lock } from 'lucide-react'
import { unlockProject } from '../lib/localStore'

/**
 * The passcode is compared client-side against the value on the project doc,
 * which any authenticated visitor can read. That is deliberate: with no
 * accounts there is nobody to scope Firestore rules to, and a real check would
 * need a Cloud Function (Blaze plan). Treat this as a "don't wander in" latch
 * for a trusted group, not as access control — anyone determined enough can
 * read the passcode straight out of the network tab.
 */
export function PasscodeGate({ project, onUnlock }) {
  const [value, setValue] = useState('')
  const [wrong, setWrong] = useState(false)

  function handleSubmit(e) {
    e.preventDefault()
    if (value.trim() === project.passcode) {
      unlockProject(project.id)
      onUnlock()
    } else {
      setWrong(true)
      setValue('')
    }
  }

  return (
    <div className="flex min-h-[80vh] items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 28 }}
        className="card w-full max-w-sm p-7"
      >
        <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-accent-soft">
          <Lock className="h-5 w-5 text-accent" />
        </div>

        <h1 className="text-lg font-semibold tracking-tight">{project.name}</h1>
        <p className="mt-1 text-sm text-ink-500 dark:text-ink-400">
          This project is passcode protected. Ask whoever shared the link.
        </p>

        <motion.form
          onSubmit={handleSubmit}
          className="mt-6 space-y-3"
          animate={wrong ? { x: [0, -8, 8, -5, 5, 0] } : {}}
          transition={{ duration: 0.35 }}
          onAnimationComplete={() => setWrong(false)}
        >
          <input
            className="input text-center tracking-[0.3em]"
            type="password"
            inputMode="text"
            autoComplete="off"
            autoFocus
            placeholder="••••"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            aria-label="Passcode"
            aria-invalid={wrong}
          />
          <button type="submit" className="btn-primary w-full" disabled={!value.trim()}>
            Unlock
            <ArrowRight className="h-4 w-4" />
          </button>
        </motion.form>

        <p className="mt-4 text-center text-xs text-ink-400">
          Remembered on this device so you're only asked once.
        </p>
      </motion.div>
    </div>
  )
}
