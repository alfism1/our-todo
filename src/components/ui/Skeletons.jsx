export function ProjectCardSkeleton() {
  return (
    <div className="card p-5">
      <div className="flex items-center gap-3">
        <div className="skeleton h-9 w-9 rounded-xl" />
        <div className="flex-1 space-y-2">
          <div className="skeleton h-4 w-2/5" />
          <div className="skeleton h-3 w-3/5" />
        </div>
      </div>
      <div className="skeleton mt-5 h-1.5 w-full rounded-full" />
    </div>
  )
}

export function TodoSkeleton({ width = 'w-3/5' }) {
  return (
    <div className="card flex items-center gap-3 p-4">
      <div className="skeleton h-5 w-5 shrink-0 rounded-md" />
      <div className="flex-1 space-y-2">
        <div className={`skeleton h-4 ${width}`} />
        <div className="skeleton h-3 w-1/4" />
      </div>
    </div>
  )
}

export function TodoListSkeleton() {
  return (
    <div className="space-y-2.5">
      <TodoSkeleton width="w-3/5" />
      <TodoSkeleton width="w-2/5" />
      <TodoSkeleton width="w-1/2" />
      <TodoSkeleton width="w-1/3" />
    </div>
  )
}
