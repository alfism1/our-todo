import { useState } from 'react'
import { Bell, BellOff, Check } from 'lucide-react'
import {
  notificationPermission,
  notificationsSupported,
  requestNotificationPermission,
} from '../lib/reminders'

/**
 * Shown inline next to the reminder field rather than on load — browsers
 * penalise permission prompts that arrive without context, and Safari only
 * grants them from a user gesture.
 */
export function NotificationPrompt() {
  const [permission, setPermission] = useState(notificationPermission)

  if (!notificationsSupported) {
    return (
      <Note icon={BellOff}>
        This browser can't show notifications. The reminder is still saved and will show up on a
        device that can.
      </Note>
    )
  }

  if (permission === 'granted') {
    return (
      <Note icon={Check} tone="ok">
        Reminders will pop up while this tab is open.
      </Note>
    )
  }

  if (permission === 'denied') {
    return (
      <Note icon={BellOff}>
        Notifications are blocked for this site. Re-enable them in your browser's site settings to
        get reminders.
      </Note>
    )
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-accent-soft px-3.5 py-3">
      <p className="flex items-center gap-2 text-sm text-ink-600 dark:text-ink-300">
        <Bell className="h-4 w-4 shrink-0 text-accent" />
        Allow notifications to get this reminder.
      </p>
      <button
        type="button"
        className="btn-primary !py-1.5 !text-xs"
        onClick={async () => setPermission(await requestNotificationPermission())}
      >
        Enable
      </button>
    </div>
  )
}

function Note({ icon: Icon, children, tone }) {
  return (
    <p
      className={`flex items-start gap-2 rounded-xl px-3.5 py-3 text-sm ${
        tone === 'ok'
          ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300'
          : 'bg-ink-100 text-ink-500 dark:bg-white/5 dark:text-ink-400'
      }`}
    >
      <Icon className="mt-0.5 h-4 w-4 shrink-0" />
      <span className="leading-relaxed">{children}</span>
    </p>
  )
}
