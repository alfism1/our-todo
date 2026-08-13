import { useState } from 'react'
import { motion } from 'framer-motion'
import { Plus } from 'lucide-react'
import { PrioritySelect } from './PrioritySelect'

/**
 * Deliberately minimal: type, hit enter, done. Everything else about a task is
 * set afterwards in the editor, so adding one never costs more than a sentence.
 */
export function TodoComposer({ onAdd }) {
  const [title, setTitle] = useState('')
  const [priority, setPriority] = useState('medium')
  const [focused, setFocused] = useState(false)
  const [busy, setBusy] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    const value = title.trim()
    if (!value || busy) return

    setBusy(true)
    setTitle('')
    try {
      await onAdd({ title: value, priority })
      setPriority('medium')
    } catch {
      setTitle(value) // put it back so nothing is lost on a failed write
    } finally {
      setBusy(false)
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      onFocus={() => setFocused(true)}
      // Stays open while focus moves *within* the composer, so clicking a
      // priority button doesn't collapse the row out from under the cursor.
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget)) setFocused(false)
      }}
      className="card overflow-hidden p-2"
    >
      <div className="flex items-center gap-2">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-accent-soft">
          <Plus className="h-[18px] w-[18px] text-accent" />
        </div>
        <input
          className="flex-1 bg-transparent py-2 text-[15px] outline-none placeholder:text-ink-400"
          placeholder="Add a task…"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          maxLength={200}
          aria-label="New task"
        />
        {title.trim() && (
          <motion.button
            type="submit"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="btn-primary !py-2"
            disabled={busy}
          >
            Add
          </motion.button>
        )}
      </div>

      <motion.div
        initial={false}
        animate={{ height: focused || title ? 'auto' : 0, opacity: focused || title ? 1 : 0 }}
        transition={{ duration: 0.18, ease: 'easeOut' }}
        className="overflow-hidden"
      >
        <div className="px-1 pb-1 pt-2">
          <PrioritySelect value={priority} onChange={setPriority} />
        </div>
      </motion.div>
    </form>
  )
}
