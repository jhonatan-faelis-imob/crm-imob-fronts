import type { Task } from '@/types'
import { TaskCard } from './task-card'
import { formatGroupDate, isOverdue, isToday, isTomorrow, isWithinNextDays } from './date-utils'

type BucketKey = 'vencidas' | 'hoje' | 'amanha' | 'semana' | 'proximas' | 'anteriores'

const BUCKET_LABELS: Record<BucketKey, string> = {
  vencidas: 'Vencidas',
  hoje: 'Hoje',
  amanha: 'Amanhã',
  semana: 'Esta semana',
  proximas: 'Próximas',
  anteriores: 'Anteriores',
}

const BUCKET_ORDER: BucketKey[] = ['vencidas', 'hoje', 'amanha', 'semana', 'proximas', 'anteriores']

function bucketOf(task: Task): BucketKey {
  if (task.status === 'pendente' && isOverdue(task.dueDate)) return 'vencidas'
  if (isToday(task.dueDate)) return 'hoje'
  if (isTomorrow(task.dueDate)) return 'amanha'
  if (isWithinNextDays(task.dueDate, 7)) return 'semana'
  if (isOverdue(task.dueDate)) return 'anteriores'
  return 'proximas'
}

function groupLabel(key: BucketKey, tasks: Task[]) {
  if (key !== 'proximas' && key !== 'anteriores') return BUCKET_LABELS[key]
  const dates = Array.from(new Set(tasks.map((task) => new Date(task.dueDate).toDateString())))
  if (dates.length === 1) return formatGroupDate(new Date(tasks[0].dueDate))
  return BUCKET_LABELS[key]
}

export function TaskListView({
  tasks,
  newTaskId,
  onComplete,
  onEdit,
  onDelete,
  onOpenDetail,
}: {
  tasks: Task[]
  newTaskId?: string | null
  onComplete: (task: Task) => void
  onEdit: (task: Task) => void
  onDelete: (taskId: string) => void
  onOpenDetail: (task: Task) => void
}) {
  const groups = new Map<BucketKey, Task[]>()
  for (const task of tasks) {
    const key = bucketOf(task)
    const existing = groups.get(key)
    if (existing) existing.push(task)
    else groups.set(key, [task])
  }

  for (const list of groups.values()) {
    list.sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
  }

  const orderedKeys = BUCKET_ORDER.filter((key) => groups.has(key))

  if (orderedKeys.length === 0) {
    return (
      <p className="rounded-[16px] border-[0.5px] border-dashed border-neutral-200 p-8 text-center text-sm text-neutral-400">
        Nenhuma tarefa encontrada com os filtros atuais.
      </p>
    )
  }

  return (
    <div className="space-y-6">
      {orderedKeys.map((key) => {
        const groupTasks = groups.get(key) ?? []
        return (
          <div
            key={key}
            className={key === 'vencidas' ? 'rounded-[16px] bg-[#FFF5F5] p-3' : undefined}
          >
            <div className="flex items-center gap-2 px-1">
              <h3
                className={`text-sm font-semibold ${key === 'vencidas' ? 'text-danger' : 'text-neutral-900'}`}
              >
                {groupLabel(key, groupTasks)}
              </h3>
              <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-xs font-medium text-neutral-600">
                {groupTasks.length}
              </span>
            </div>

            <div className="mt-3 space-y-3">
              {groupTasks.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  parentTask={task.parentTaskId ? tasks.find((item) => item.id === task.parentTaskId) : undefined}
                  isNew={task.id === newTaskId}
                  onComplete={onComplete}
                  onEdit={onEdit}
                  onDelete={onDelete}
                  onOpenDetail={onOpenDetail}
                />
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}
