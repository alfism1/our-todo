import { forwardRef, useCallback, useState } from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { motion } from 'framer-motion'
import {
  Bell,
  CalendarDays,
  ChevronRight,
  GripVertical,
  ListChecks,
  Pencil,
  Trash2,
} from 'lucide-react'
import { Checkbox } from './Checkbox'
import { SubtaskList } from './SubtaskList'
import {
  cn,
  dueStatus,
  formatDueDate,
  formatReminder,
  PRIORITY_STYLES,
  toDate,
} from '../lib/utils'

const DUE_STYLES = {
  overdue: 'bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300',
  today: 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300',
  soon: 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300/90',
  later: 'bg-ink-100 text-ink-500 dark:bg-white/5 dark:text-ink-400',
}

// forwardRef because AnimatePresence's popLayout mode measures the exiting
// card, and dnd-kit needs the same node — hence the merged ref below.
export const TodoCard = forwardRef(function TodoCard(
  {
    todo,
    onToggle,
    onEdit,
    onDelete,
    onSubtasksChange,
    onTagClick,
    highlighted = false,
    dragEnabled = true,
  },
  forwardedRef,
) {
  const [expanded, setExpanded] = useState(false)

  const { attributes, listeners, setNodeRef, transform, transition, isDragging, isSorting } =
    useSortable({ id: todo.id, disabled: !dragEnabled })

  const setRefs = useCallback(
    (node) => {
      setNodeRef(node)
      if (typeof forwardedRef === 'function') forwardedRef(node)
      else if (forwardedRef) forwardedRef.current = node
    },
    [setNodeRef, forwardedRef],
  )

  // dnd-kit owns this node's transform, so the card deliberately has no Framer
  // `layout` prop — the two write to the same property and the projection gets
  // stuck mid-animation (cards freeze at a partial scaleY). Reorder motion
  // comes from dnd-kit's own transition instead.
  const dragStyle = isSorting
    ? { transform: CSS.Transform.toString(transform), transition }
    : undefined

  const due = toDate(todo.dueDate)
  const reminder = toDate(todo.reminderAt)
  const subtasks = todo.subtasks ?? []
  const doneSubtasks = subtasks.filter((s) => s.completed).length
  // A finished task is not late, so it drops back to the neutral badge.
  const status = due ? (todo.completed ? 'later' : dueStatus(due)) : null

  return (
    <motion.div
      ref={setRefs}
      style={{ ...dragStyle, zIndex: isDragging ? 30 : undefined }}
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -12, transition: { duration: 0.15 } }}
      transition={{ type: 'spring', stiffness: 400, damping: 34 }}
      className={cn(
        'card group relative overflow-hidden',
        isDragging && 'scale-[1.01] shadow-lift',
        todo.completed && 'bg-ink-50/60 dark:bg-ink-900/50',
      )}
    >
      {/* A collaborator just touched this — brief accent wash, then gone. */}
      {highlighted && (
        <span className="pointer-events-none absolute inset-0 animate-sync-pulse" aria-hidden="true" />
      )}

      <div className="relative flex items-start gap-2.5 p-3.5 sm:gap-3 sm:p-4">
        <button
          type="button"
          {...attributes}
          {...listeners}
          aria-label="Reorder task"
          disabled={!dragEnabled}
          className={cn(
            '-ml-1 mt-0.5 shrink-0 rounded-md p-0.5 text-ink-300 transition-opacity dark:text-ink-600',
            dragEnabled
              ? 'cursor-grab touch-none opacity-0 hover:text-ink-500 focus-visible:opacity-100 group-hover:opacity-100 active:cursor-grabbing max-sm:opacity-60'
              : 'cursor-default opacity-0',
          )}
        >
          <GripVertical className="h-4 w-4" />
        </button>

        <Checkbox
          checked={todo.completed}
          onChange={onToggle}
          label={`Mark "${todo.title}" ${todo.completed ? 'incomplete' : 'complete'}`}
          className="mt-0.5"
        />

        <div className="min-w-0 flex-1">
          <button
            type="button"
            onClick={onEdit}
            className="block w-full text-left"
          >
            <span
              className={cn(
                'break-words text-[15px] font-medium leading-snug transition-colors',
                todo.completed && 'text-ink-400 line-through dark:text-ink-500',
              )}
            >
              {todo.title}
            </span>
            {todo.notes && !todo.completed && (
              <span className="mt-1 line-clamp-2 block text-sm leading-relaxed text-ink-500 dark:text-ink-400">
                {todo.notes}
              </span>
            )}
          </button>

          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            <span className={cn('chip capitalize', PRIORITY_STYLES[todo.priority ?? 'medium'])}>
              {todo.priority ?? 'medium'}
            </span>

            {due && (
              <span className={cn('chip', DUE_STYLES[status])}>
                <CalendarDays className="h-3 w-3" />
                {formatDueDate(due)}
              </span>
            )}

            {reminder && !todo.completed && (
              <span className="chip bg-ink-100 text-ink-500 dark:bg-white/5 dark:text-ink-400">
                <Bell className="h-3 w-3" />
                {formatReminder(reminder)}
              </span>
            )}

            {subtasks.length > 0 && (
              <button
                type="button"
                onClick={() => setExpanded((v) => !v)}
                aria-expanded={expanded}
                className="chip bg-ink-100 text-ink-500 transition-colors hover:text-accent
                           dark:bg-white/5 dark:text-ink-400"
              >
                <ListChecks className="h-3 w-3" />
                <span className="tabular-nums">
                  {doneSubtasks}/{subtasks.length}
                </span>
                <ChevronRight
                  className={cn('h-3 w-3 transition-transform', expanded && 'rotate-90')}
                />
              </button>
            )}

            {todo.tags?.map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => onTagClick?.(tag)}
                className="chip bg-accent-soft text-accent transition-opacity hover:opacity-75"
              >
                #{tag}
              </button>
            ))}
          </div>

          {/* Reveal via grid-template-rows 0fr→1fr: a pure-CSS way to animate
              to an unknown height that stays clear of Framer's projection. */}
          {subtasks.length > 0 && (
            <div
              className={cn(
                'grid transition-[grid-template-rows] duration-200 ease-out',
                expanded ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]',
              )}
            >
              <div className="overflow-hidden">
                <div className="mt-2.5 border-t border-ink-200/70 pt-2 dark:border-white/10">
                  <SubtaskList subtasks={subtasks} onChange={onSubtasksChange} />
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="flex shrink-0 items-center gap-0.5 opacity-0 transition-opacity
                        focus-within:opacity-100 group-hover:opacity-100 max-sm:opacity-100">
          <IconAction label="Edit task" onClick={onEdit}>
            <Pencil className="h-3.5 w-3.5" />
          </IconAction>
          <IconAction label="Delete task" onClick={onDelete} danger>
            <Trash2 className="h-3.5 w-3.5" />
          </IconAction>
        </div>
      </div>
    </motion.div>
  )
})

function IconAction({ label, onClick, children, danger }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      className={cn(
        'rounded-lg p-2 text-ink-400 transition-colors',
        danger
          ? 'hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-500/10 dark:hover:text-rose-400'
          : 'hover:bg-ink-100 hover:text-ink-800 dark:hover:bg-white/10 dark:hover:text-ink-100',
      )}
    >
      {children}
    </button>
  )
}
