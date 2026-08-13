import { hasReminderFired, markReminderFired } from './localStore'
import { toDate } from './utils'

/**
 * Reminders are in-tab only: we hold a setTimeout per upcoming reminder and
 * fire a Notification when it lands. Close the tab and nothing fires.
 *
 * True background push (working with the browser closed) would need Firebase
 * Cloud Messaging plus a service worker registering `onBackgroundMessage`. FCM
 * itself is free on the Spark plan, but *sending* on a schedule needs a server
 * or Cloud Function (Blaze), so it's parked as a stretch goal. See README.
 */

export const notificationsSupported =
  typeof window !== 'undefined' && 'Notification' in window

export function notificationPermission() {
  return notificationsSupported ? Notification.permission : 'unsupported'
}

export async function requestNotificationPermission() {
  if (!notificationsSupported) return 'unsupported'
  if (Notification.permission !== 'default') return Notification.permission
  try {
    return await Notification.requestPermission()
  } catch {
    return 'denied'
  }
}

// setTimeout overflows past ~24.8 days and fires immediately, so anything
// further out is simply not scheduled — it gets picked up on a later visit.
const MAX_TIMEOUT_MS = 2 ** 31 - 1

export function reminderKey(todo, at) {
  return `${todo.id}@${at.getTime()}`
}

/**
 * Arms timers for every pending reminder and returns a disposer. Called with
 * the full todo list, so it re-arms from scratch whenever todos change.
 */
export function scheduleReminders(todos, { projectName, onFire } = {}) {
  if (notificationPermission() !== 'granted') return () => {}

  const timers = []
  const now = Date.now()

  for (const todo of todos) {
    if (todo.completed) continue
    const at = toDate(todo.reminderAt)
    if (!at) continue

    const key = reminderKey(todo, at)
    if (hasReminderFired(key)) continue

    const delay = at.getTime() - now
    if (delay < 0 || delay > MAX_TIMEOUT_MS) continue

    timers.push(
      setTimeout(() => {
        markReminderFired(key)
        fireNotification(todo, projectName)
        onFire?.(todo)
      }, delay),
    )
  }

  return () => timers.forEach(clearTimeout)
}

function fireNotification(todo, projectName) {
  try {
    const n = new Notification(todo.title, {
      body: projectName ? `Reminder · ${projectName}` : 'Reminder',
      tag: todo.id, // replaces rather than stacks if it somehow fires twice
      requireInteraction: false,
    })
    n.onclick = () => {
      window.focus()
      n.close()
    }
  } catch {
    /* Some browsers throw when constructing Notification outside a SW */
  }
}
