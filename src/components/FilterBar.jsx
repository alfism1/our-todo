import { motion } from 'framer-motion'
import { ArrowUpDown, Search, X } from 'lucide-react'
import { cn, PRIORITIES, PRIORITY_DOTS } from '../lib/utils'

const STATUSES = [
  { value: 'all', label: 'All' },
  { value: 'active', label: 'Active' },
  { value: 'completed', label: 'Done' },
]

export const SORTS = [
  { value: 'manual', label: 'Manual order' },
  { value: 'priority', label: 'Priority' },
  { value: 'dueDate', label: 'Due date' },
  { value: 'created', label: 'Newest first' },
]

export function FilterBar({ filters, onChange, allTags, counts }) {
  const set = (patch) => onChange({ ...filters, ...patch })
  const filtering =
    filters.status !== 'all' || filters.priority !== 'all' || filters.tag || filters.search

  return (
    <div className="space-y-2.5">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
          <input
            className="input pl-10 pr-9"
            placeholder="Search tasks and notes…"
            value={filters.search}
            onChange={(e) => set({ search: e.target.value })}
            aria-label="Search tasks"
          />
          {filters.search && (
            <button
              type="button"
              onClick={() => set({ search: '' })}
              aria-label="Clear search"
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-ink-400
                         transition-colors hover:text-ink-700 dark:hover:text-ink-200"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        <div className="relative">
          <ArrowUpDown className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-ink-400" />
          <select
            className="input h-full appearance-none py-0 pl-9 pr-8 text-sm"
            value={filters.sort}
            onChange={(e) => set({ sort: e.target.value })}
            aria-label="Sort tasks"
          >
            {SORTS.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="-mx-4 flex items-center gap-1.5 overflow-x-auto px-4 pb-0.5 sm:mx-0 sm:flex-wrap sm:px-0">
        <div className="flex shrink-0 gap-1 rounded-xl bg-ink-100 p-1 dark:bg-white/5">
          {STATUSES.map((s) => (
            <button
              key={s.value}
              type="button"
              onClick={() => set({ status: s.value })}
              className={cn(
                'relative rounded-lg px-3 py-1.5 text-xs font-medium transition-colors',
                filters.status === s.value
                  ? 'text-ink-900 dark:text-ink-50'
                  : 'text-ink-500 hover:text-ink-700 dark:hover:text-ink-300',
              )}
            >
              {filters.status === s.value && (
                <motion.span
                  layoutId="status-pill"
                  className="absolute inset-0 rounded-lg bg-white shadow-sm dark:bg-ink-800"
                  transition={{ type: 'spring', stiffness: 420, damping: 34 }}
                />
              )}
              <span className="relative">
                {s.label}
                <span className="ml-1 tabular-nums opacity-50">{counts[s.value]}</span>
              </span>
            </button>
          ))}
        </div>

        <span className="h-5 w-px shrink-0 bg-ink-200 dark:bg-white/10" aria-hidden="true" />

        {PRIORITIES.map((p) => {
          const active = filters.priority === p
          return (
            <button
              key={p}
              type="button"
              onClick={() => set({ priority: active ? 'all' : p })}
              aria-pressed={active}
              className={cn(
                'chip shrink-0 border capitalize transition-colors',
                active
                  ? 'border-transparent bg-accent-soft text-accent'
                  : 'border-ink-200 text-ink-500 hover:border-ink-300 dark:border-white/10 dark:text-ink-400',
              )}
            >
              <span className={cn('h-1.5 w-1.5 rounded-full', PRIORITY_DOTS[p])} />
              {p}
            </button>
          )
        })}

        {allTags.length > 0 && (
          <>
            <span className="h-5 w-px shrink-0 bg-ink-200 dark:bg-white/10" aria-hidden="true" />
            {allTags.map((tag) => {
              const active = filters.tag === tag
              return (
                <button
                  key={tag}
                  type="button"
                  onClick={() => set({ tag: active ? '' : tag })}
                  aria-pressed={active}
                  className={cn(
                    'chip shrink-0 border transition-colors',
                    active
                      ? 'border-transparent bg-accent-soft text-accent'
                      : 'border-ink-200 text-ink-500 hover:border-ink-300 dark:border-white/10 dark:text-ink-400',
                  )}
                >
                  #{tag}
                </button>
              )
            })}
          </>
        )}

        {filtering && (
          <button
            type="button"
            onClick={() => set({ status: 'all', priority: 'all', tag: '', search: '' })}
            className="chip shrink-0 text-ink-400 underline-offset-2 hover:underline"
          >
            Clear
          </button>
        )}
      </div>
    </div>
  )
}
