/**
 * Everything this app knows "per device" lives in localStorage: which projects
 * you've created or visited (there are no accounts, so there is no server-side
 * list), and which passcode-gated projects you've already unlocked.
 */

const KEYS = {
  projects: 'ourtodo:projects',
  unlocked: 'ourtodo:unlocked',
  theme: 'ourtodo:theme',
  firedReminders: 'ourtodo:fired-reminders',
}

function read(key, fallback) {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : fallback
  } catch {
    return fallback
  }
}

function write(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    /* private mode / quota — the app still works, it just forgets */
  }
}

/* ---------- Known projects (the Home list) ---------- */

/** @returns {{id: string, lastOpened: number}[]} newest-first */
export function getKnownProjects() {
  const list = read(KEYS.projects, [])
  return Array.isArray(list) ? list : []
}

export function rememberProject(id) {
  const list = getKnownProjects().filter((p) => p.id !== id)
  list.unshift({ id, lastOpened: Date.now() })
  write(KEYS.projects, list)
}

export function forgetProject(id) {
  write(
    KEYS.projects,
    getKnownProjects().filter((p) => p.id !== id),
  )
  lockProject(id)
}

/* ---------- Passcode unlocks ---------- */

export function isUnlocked(id) {
  return read(KEYS.unlocked, []).includes(id)
}

export function unlockProject(id) {
  const list = read(KEYS.unlocked, [])
  if (!list.includes(id)) write(KEYS.unlocked, [...list, id])
}

export function lockProject(id) {
  write(
    KEYS.unlocked,
    read(KEYS.unlocked, []).filter((x) => x !== id),
  )
}

/* ---------- Theme ---------- */

export function getStoredTheme() {
  try {
    return localStorage.getItem(KEYS.theme)
  } catch {
    return null
  }
}

export function setStoredTheme(theme) {
  try {
    localStorage.setItem(KEYS.theme, theme)
  } catch {
    /* ignore */
  }
}

/* ---------- Reminders already shown ---------- */

/**
 * Keyed by `todoId@reminderTimestamp` so editing a reminder re-arms it while a
 * page refresh does not replay a notification you already dismissed.
 */
export function hasReminderFired(key) {
  return read(KEYS.firedReminders, []).includes(key)
}

export function markReminderFired(key) {
  const list = read(KEYS.firedReminders, [])
  if (list.includes(key)) return
  // Bounded so this never grows without limit on a long-lived device.
  write(KEYS.firedReminders, [...list, key].slice(-200))
}
