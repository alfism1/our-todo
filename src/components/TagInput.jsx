import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { X } from 'lucide-react'

const MAX_TAGS = 8
const MAX_LENGTH = 20

export function TagInput({ tags = [], onChange, suggestions = [] }) {
  const [draft, setDraft] = useState('')

  function add(raw) {
    const tag = raw.trim().toLowerCase().replace(/\s+/g, '-').slice(0, MAX_LENGTH)
    if (!tag || tags.includes(tag) || tags.length >= MAX_TAGS) {
      setDraft('')
      return
    }
    onChange([...tags, tag])
    setDraft('')
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      add(draft)
    } else if (e.key === 'Backspace' && !draft && tags.length) {
      onChange(tags.slice(0, -1))
    }
  }

  const unused = suggestions.filter((s) => !tags.includes(s)).slice(0, 6)

  return (
    <div>
      <div
        className="flex min-h-[46px] flex-wrap items-center gap-1.5 rounded-xl border border-ink-200
                   bg-white px-2.5 py-2 transition-colors focus-within:border-accent
                   focus-within:ring-2 focus-within:ring-accent/25 dark:border-white/10 dark:bg-ink-950/60"
      >
        <AnimatePresence initial={false}>
          {tags.map((tag) => (
            <motion.span
              key={tag}
              layout
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.14 }}
              className="chip bg-accent-soft text-accent"
            >
              {tag}
              <button
                type="button"
                onClick={() => onChange(tags.filter((t) => t !== tag))}
                aria-label={`Remove tag ${tag}`}
                className="-mr-0.5 rounded-full p-0.5 transition-opacity hover:opacity-60"
              >
                <X className="h-3 w-3" />
              </button>
            </motion.span>
          ))}
        </AnimatePresence>

        <input
          className="min-w-[7rem] flex-1 bg-transparent px-1 py-0.5 text-sm outline-none
                     placeholder:text-ink-400"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={() => add(draft)}
          maxLength={MAX_LENGTH}
          placeholder={tags.length >= MAX_TAGS ? 'Tag limit reached' : 'Add a tag…'}
          disabled={tags.length >= MAX_TAGS}
          aria-label="Add a tag"
        />
      </div>

      {unused.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {unused.map((tag) => (
            <button
              key={tag}
              type="button"
              onClick={() => add(tag)}
              className="chip border border-dashed border-ink-300 text-ink-500 transition-colors
                         hover:border-accent hover:text-accent dark:border-white/15 dark:text-ink-400"
            >
              + {tag}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
