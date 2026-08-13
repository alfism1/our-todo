import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import { restrictToParentElement, restrictToVerticalAxis } from '@dnd-kit/modifiers'
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { AnimatePresence } from 'framer-motion'
import { TodoCard } from './TodoCard'

export function TodoList({ todos, dragEnabled, onReorder, remoteIds, handlers }) {
  const sensors = useSensors(
    // A few pixels of travel before a drag starts, so taps on the grip that
    // were meant as taps don't turn into accidental reorders.
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  function handleDragEnd({ active, over }) {
    if (!over || active.id === over.id) return
    onReorder(active.id, over.id)
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      modifiers={[restrictToVerticalAxis, restrictToParentElement]}
      onDragEnd={handleDragEnd}
    >
      <SortableContext items={todos.map((t) => t.id)} strategy={verticalListSortingStrategy}>
        <div className="space-y-2.5">
          <AnimatePresence initial={false}>
            {todos.map((todo) => (
              <TodoCard
                key={todo.id}
                todo={todo}
                dragEnabled={dragEnabled}
                highlighted={remoteIds.has(todo.id)}
                onToggle={(next) => handlers.onToggle(todo, next)}
                onEdit={() => handlers.onEdit(todo)}
                onDelete={() => handlers.onDelete(todo)}
                onSubtasksChange={(subtasks) => handlers.onSubtasksChange(todo, subtasks)}
                onTagClick={handlers.onTagClick}
              />
            ))}
          </AnimatePresence>
        </div>
      </SortableContext>
    </DndContext>
  )
}
