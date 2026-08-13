import { Modal } from './Modal'

export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = 'Delete',
  destructive = true,
  busy = false,
}) {
  return (
    <Modal open={open} onClose={onClose} title={title} size="sm">
      <p className="text-sm leading-relaxed text-ink-600 dark:text-ink-300">{message}</p>
      <div className="mt-6 flex justify-end gap-2">
        <button type="button" className="btn-ghost" onClick={onClose} disabled={busy}>
          Cancel
        </button>
        <button
          type="button"
          onClick={onConfirm}
          disabled={busy}
          className={
            destructive
              ? 'btn bg-rose-600 text-white shadow-sm hover:bg-rose-700'
              : 'btn-primary'
          }
        >
          {busy ? 'Working…' : confirmLabel}
        </button>
      </div>
    </Modal>
  )
}
