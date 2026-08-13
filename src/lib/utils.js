export function cn(...parts) {
  return parts.filter(Boolean).join(' ')
}

/* ---------- Colors ---------- */

export const PROJECT_COLORS = [
  '#6366f1', // indigo
  '#8b5cf6', // violet
  '#ec4899', // pink
  '#f43f5e', // rose
  '#f97316', // orange
  '#eab308', // amber
  '#22c55e', // green
  '#14b8a6', // teal
  '#0ea5e9', // sky
  '#64748b', // slate
]

export function randomProjectColor() {
  return PROJECT_COLORS[Math.floor(Math.random() * PROJECT_COLORS.length)]
}

/** '#6366f1' → '99 102 241', the space-separated form Tailwind's `<alpha-value>` needs. */
export function hexToRgbTriple(hex) {
  const clean = String(hex || '').replace('#', '')
  const full =
    clean.length === 3
      ? clean
          .split('')
          .map((c) => c + c)
          .join('')
      : clean
  if (!/^[0-9a-f]{6}$/i.test(full)) return '99 102 241'
  const n = parseInt(full, 16)
  return `${(n >> 16) & 255} ${(n >> 8) & 255} ${n & 255}`
}

/* ---------- Dates ---------- */

export const DAY_MS = 86_400_000

/** Firestore Timestamp | Date | number | null → Date | null */
export function toDate(value) {
  if (!value) return null
  if (typeof value.toDate === 'function') return value.toDate()
  const d = value instanceof Date ? value : new Date(value)
  return Number.isNaN(d.getTime()) ? null : d
}

function startOfDay(d) {
  const c = new Date(d)
  c.setHours(0, 0, 0, 0)
  return c
}

/** Whole calendar days from today to `date` (negative = past). */
export function daysUntil(date) {
  return Math.round((startOfDay(date) - startOfDay(new Date())) / DAY_MS)
}

/**
 * Due-date urgency, used for badge color and the overdue/due-soon flags.
 * @returns {'overdue'|'today'|'soon'|'later'}
 */
export function dueStatus(date) {
  const days = daysUntil(date)
  if (days < 0) return 'overdue'
  if (days === 0) return 'today'
  if (days <= 2) return 'soon'
  return 'later'
}

export function formatDueDate(date) {
  const days = daysUntil(date)
  if (days === 0) return 'Today'
  if (days === 1) return 'Tomorrow'
  if (days === -1) return 'Yesterday'
  if (days < 0 && days > -7) return `${-days} days ago`
  if (days > 0 && days < 7) return date.toLocaleDateString(undefined, { weekday: 'long' })
  return date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    ...(date.getFullYear() !== new Date().getFullYear() && { year: 'numeric' }),
  })
}

export function formatReminder(date) {
  return date.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

/** Date → 'YYYY-MM-DD' in local time (what <input type="date"> expects). */
export function toDateInputValue(date) {
  if (!date) return ''
  const pad = (n) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

/** Date → 'YYYY-MM-DDTHH:mm' in local time (what <input type="datetime-local"> expects). */
export function toDateTimeInputValue(date) {
  if (!date) return ''
  const pad = (n) => String(n).padStart(2, '0')
  return `${toDateInputValue(date)}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

/** Parses the local-time strings above back into a Date, avoiding UTC drift. */
export function fromDateInputValue(value) {
  if (!value) return null
  const [datePart, timePart = '00:00'] = value.split('T')
  const [y, m, d] = datePart.split('-').map(Number)
  const [hh, mm] = timePart.split(':').map(Number)
  if (!y || !m || !d) return null
  return new Date(y, m - 1, d, hh || 0, mm || 0, 0, 0)
}

/* ---------- Priority ---------- */

export const PRIORITIES = ['low', 'medium', 'high']

export const PRIORITY_RANK = { high: 0, medium: 1, low: 2 }

export const PRIORITY_STYLES = {
  high: 'bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300',
  medium: 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300',
  low: 'bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-300',
}

export const PRIORITY_DOTS = {
  high: 'bg-rose-500',
  medium: 'bg-amber-500',
  low: 'bg-sky-500',
}

/* ---------- Misc ---------- */

export function uid(prefix = '') {
  return prefix + Math.random().toString(36).slice(2, 10)
}

export function pluralize(n, singular, plural = singular + 's') {
  return `${n} ${n === 1 ? singular : plural}`
}

/** Splits an array into chunks of `size` (used to batch Firestore `in` queries). */
export function chunk(array, size) {
  const out = []
  for (let i = 0; i < array.length; i += size) out.push(array.slice(i, i + size))
  return out
}
