import { useEffect, useState } from 'react'
import { Eye, EyeOff, Lock } from 'lucide-react'
import { Modal } from './ui/Modal'
import { ColorPicker } from './ColorPicker'
import { randomProjectColor } from '../lib/utils'

const blank = () => ({ name: '', description: '', color: randomProjectColor(), passcode: '' })

/**
 * Doubles as the create and edit form — `project` decides which. Submitting
 * hands the caller a plain patch object; persistence lives with the caller.
 */
export function ProjectFormModal({ open, onClose, onSubmit, project = null }) {
  const [form, setForm] = useState(blank)
  const [showPasscode, setShowPasscode] = useState(false)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (!open) return
    setForm(
      project
        ? {
            name: project.name ?? '',
            description: project.description ?? '',
            color: project.color ?? randomProjectColor(),
            passcode: project.passcode ?? '',
          }
        : blank(),
    )
    setShowPasscode(false)
    setBusy(false)
  }, [open, project])

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }))

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.name.trim() || busy) return
    setBusy(true)
    try {
      await onSubmit({
        name: form.name.trim(),
        description: form.description.trim(),
        color: form.color,
        passcode: form.passcode.trim() || null,
      })
      onClose()
    } finally {
      setBusy(false)
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={project ? 'Project settings' : 'New project'}
      description={
        project ? 'Changes are visible to everyone with the link.' : 'Share it with a link once it exists.'
      }
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label htmlFor="project-name" className="mb-1.5 block text-sm font-medium">
            Name
          </label>
          <input
            id="project-name"
            className="input"
            value={form.name}
            onChange={set('name')}
            placeholder="Weekend trip, Groceries, Q3 launch…"
            maxLength={80}
            autoFocus
            required
          />
        </div>

        <div>
          <label htmlFor="project-description" className="mb-1.5 block text-sm font-medium">
            Description <span className="font-normal text-ink-400">· optional</span>
          </label>
          <textarea
            id="project-description"
            className="input resize-none"
            rows={2}
            value={form.description}
            onChange={set('description')}
            placeholder="What is this list for?"
            maxLength={200}
          />
        </div>

        <div>
          <span className="mb-2 block text-sm font-medium">Accent color</span>
          <ColorPicker value={form.color} onChange={(color) => setForm((f) => ({ ...f, color }))} />
        </div>

        <div>
          <label htmlFor="project-passcode" className="mb-1.5 flex items-center gap-1.5 text-sm font-medium">
            <Lock className="h-3.5 w-3.5 text-ink-400" />
            Passcode <span className="font-normal text-ink-400">· optional</span>
          </label>
          <div className="relative">
            <input
              id="project-passcode"
              className="input pr-11"
              type={showPasscode ? 'text' : 'password'}
              value={form.passcode}
              onChange={set('passcode')}
              placeholder="Leave empty for no passcode"
              autoComplete="off"
              maxLength={40}
            />
            <button
              type="button"
              onClick={() => setShowPasscode((v) => !v)}
              aria-label={showPasscode ? 'Hide passcode' : 'Show passcode'}
              className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded-lg p-2 text-ink-400
                         transition-colors hover:text-ink-700 dark:hover:text-ink-200"
            >
              {showPasscode ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          <p className="mt-1.5 text-xs leading-relaxed text-ink-400">
            A soft gate for a trusted circle — it keeps the link from being casually useful, but it
            isn't real security.
          </p>
        </div>

        <div className="flex justify-end gap-2 pt-1">
          <button type="button" className="btn-ghost" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="btn-primary" disabled={!form.name.trim() || busy}>
            {busy ? 'Saving…' : project ? 'Save changes' : 'Create project'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
