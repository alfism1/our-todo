import { useEffect, useState } from 'react'
import { Bell, BellOff, CalendarDays, Trash2 } from 'lucide-react'
import { Modal } from './ui/Modal'
import { PrioritySelect } from './PrioritySelect'
import { SubtaskList } from './SubtaskList'
import { TagInput } from './TagInput'
import { NotificationPrompt } from './NotificationPrompt'
import {
  fromDateInputValue,
  toDate,
  toDateInputValue,
  toDateTimeInputValue,
} from '../lib/utils'

function formOf(todo) {
  return {
    title: todo?.title ?? '',
    notes: todo?.notes ?? '',
    priority: todo?.priority ?? 'medium',
    dueDate: toDateInputValue(toDate(todo?.dueDate)),
    reminderAt: toDateTimeInputValue(toDate(todo?.reminderAt)),
    tags: todo?.tags ?? [],
    subtasks: todo?.subtasks ?? [],
  }
}

export function TodoEditor({ open, todo, onClose, onSave, onDelete, tagSuggestions = [] }) {
  const [form, setForm] = useState(() => formOf(todo))
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (open) {
      setForm(formOf(todo))
      setBusy(false)
    }
  }, [open, todo?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  const set = (key, value) => setForm((f) => ({ ...f, [key]: value }))

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.title.trim() || busy) return
    setBusy(true)
    try {
      await onSave({
        title: form.title.trim(),
        notes: form.notes.trim(),
        priority: form.priority,
        dueDate: fromDateInputValue(form.dueDate),
        reminderAt: fromDateInputValue(form.reminderAt),
        tags: form.tags,
        subtasks: form.subtasks,
      })
      onClose()
    } finally {
      setBusy(false)
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Edit task" size="lg">
      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label htmlFor="todo-title" className="mb-1.5 block text-sm font-medium">
            Task
          </label>
          <input
            id="todo-title"
            className="input"
            value={form.title}
            onChange={(e) => set('title', e.target.value)}
            maxLength={200}
            required
          />
        </div>

        <div>
          <label htmlFor="todo-notes" className="mb-1.5 block text-sm font-medium">
            Notes
          </label>
          <textarea
            id="todo-notes"
            className="input resize-none"
            rows={3}
            value={form.notes}
            onChange={(e) => set('notes', e.target.value)}
            placeholder="Details, links, context…"
            maxLength={2000}
          />
        </div>

        <div>
          <span className="mb-2 block text-sm font-medium">Priority</span>
          <PrioritySelect value={form.priority} onChange={(p) => set('priority', p)} />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="todo-due" className="mb-1.5 flex items-center gap-1.5 text-sm font-medium">
              <CalendarDays className="h-3.5 w-3.5 text-ink-400" />
              Due date
            </label>
            <div className="flex gap-2">
              <input
                id="todo-due"
                type="date"
                className="input"
                value={form.dueDate}
                onChange={(e) => set('dueDate', e.target.value)}
              />
              {form.dueDate && (
                <button
                  type="button"
                  className="btn-ghost !px-3"
                  onClick={() => set('dueDate', '')}
                  aria-label="Clear due date"
                >
                  Clear
                </button>
              )}
            </div>
          </div>

          <div>
            <label
              htmlFor="todo-reminder"
              className="mb-1.5 flex items-center gap-1.5 text-sm font-medium"
            >
              <Bell className="h-3.5 w-3.5 text-ink-400" />
              Reminder
            </label>
            <div className="flex gap-2">
              <input
                id="todo-reminder"
                type="datetime-local"
                className="input"
                value={form.reminderAt}
                onChange={(e) => set('reminderAt', e.target.value)}
              />
              {form.reminderAt && (
                <button
                  type="button"
                  className="btn-ghost !px-3"
                  onClick={() => set('reminderAt', '')}
                  aria-label="Clear reminder"
                >
                  <BellOff className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
        </div>

        {form.reminderAt && <NotificationPrompt />}

        <div>
          <span className="mb-2 block text-sm font-medium">Tags</span>
          <TagInput
            tags={form.tags}
            onChange={(tags) => set('tags', tags)}
            suggestions={tagSuggestions}
          />
        </div>

        <div>
          <span className="mb-1.5 block text-sm font-medium">
            Subtasks
            {form.subtasks.length > 0 && (
              <span className="ml-1.5 font-normal text-ink-400">
                {form.subtasks.filter((s) => s.completed).length}/{form.subtasks.length}
              </span>
            )}
          </span>
          <SubtaskList subtasks={form.subtasks} onChange={(s) => set('subtasks', s)} />
        </div>

        <div className="flex items-center justify-between gap-2 border-t border-ink-200/70 pt-5 dark:border-white/10">
          <button
            type="button"
            onClick={() => {
              onClose()
              onDelete()
            }}
            className="btn-ghost !px-3 text-rose-600 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-500/10"
          >
            <Trash2 className="h-4 w-4" />
            Delete
          </button>
          <div className="flex gap-2">
            <button type="button" className="btn-ghost" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={!form.title.trim() || busy}>
              {busy ? 'Saving…' : 'Save'}
            </button>
          </div>
        </div>
      </form>
    </Modal>
  )
}
