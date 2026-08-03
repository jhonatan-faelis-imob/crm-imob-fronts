import { Check, Link2, Pencil, Trash2, User, X } from 'lucide-react'
import Link from 'next/link'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { getInitials } from '@/lib/utils'
import type { Task } from '@/types'
import { PRIORITY_META, TASK_TYPE_META } from './constants'
import { formatTime, isOverdue, isToday } from './date-utils'

export function TaskCard({
  task,
  parentTask,
  isNew,
  onComplete,
  onEdit,
  onDelete,
}: {
  task: Task
  parentTask?: Task
  isNew?: boolean
  onComplete: (task: Task) => void
  onEdit: (task: Task) => void
  onDelete: (taskId: string) => void
}) {
  const typeMeta = TASK_TYPE_META[task.type]
  const TypeIcon = typeMeta.icon
  const priorityMeta = PRIORITY_META[task.priority]
  const overdue = task.status === 'pendente' && isOverdue(task.dueDate)
  const dueToday = task.status === 'pendente' && isToday(task.dueDate)
  const isDone = task.status === 'concluida'
  const isCancelled = task.status === 'cancelada'

  return (
    <div
      className={`group relative flex items-start gap-3 rounded-[16px] border-[0.5px] border-l-[3px] border-neutral-200 border-l-transparent bg-white p-4 transition-colors hover:border-l-brand hover:bg-[#FAFAFA] ${
        isCancelled ? 'opacity-60' : ''
      }`}
    >
      <button
        type="button"
        role="checkbox"
        aria-checked={isDone}
        aria-label={isDone ? 'Tarefa concluída' : 'Marcar como concluída'}
        onClick={() => task.status === 'pendente' && onComplete(task)}
        disabled={task.status !== 'pendente'}
        className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-[1.5px] transition-colors ${
          isDone
            ? 'border-success bg-success text-white'
            : isCancelled
              ? 'cursor-not-allowed border-neutral-200 bg-neutral-100 text-neutral-300'
              : 'cursor-pointer border-neutral-200 hover:border-brand'
        }`}
      >
        {isDone && <Check className="h-3 w-3" />}
        {isCancelled && <X className="h-3 w-3" />}
      </button>

      <span
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full"
        style={{ backgroundColor: typeMeta.bg, color: typeMeta.text }}
      >
        <TypeIcon className="h-4 w-4" />
      </span>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p
            className={`text-sm font-medium ${
              isDone ? 'text-neutral-400 line-through' : 'text-neutral-900'
            }`}
          >
            {task.title}
          </p>
          {isNew && (
            <span className="animate-pulse rounded-full bg-brand px-2 py-0.5 text-[11px] font-medium text-white">
              Nova
            </span>
          )}
          {overdue && (
            <span className="rounded-full bg-[#FFEBEE] px-2 py-0.5 text-[11px] font-medium text-danger">
              Vencida
            </span>
          )}
          {dueToday && (
            <span className="rounded-full bg-[#FFF3E0] px-2 py-0.5 text-[11px] font-medium text-warning">
              Hoje
            </span>
          )}
          {task.hasNextTask && (
            <span title="Ao concluir, gera a próxima tarefa automaticamente" className="text-neutral-400">
              <Link2 className="h-3.5 w-3.5" />
            </span>
          )}
        </div>

        {task.leadName && task.leadId && (
          <Link
            href={`/leads/${task.leadId}`}
            className="mt-1 flex items-center gap-1 text-xs text-neutral-400 hover:text-brand"
          >
            <User className="h-3 w-3" />
            {task.leadName}
          </Link>
        )}

        {parentTask && (
          <p className="mt-1 text-[11px] text-neutral-400">↳ Originada de: {parentTask.title}</p>
        )}
      </div>

      <div className="flex shrink-0 flex-col items-end gap-1.5">
        <div className="flex items-center gap-1.5">
          <div className="hidden items-center gap-1 group-hover:flex">
            <button
              type="button"
              aria-label="Editar tarefa"
              onClick={() => onEdit(task)}
              className="rounded-[6px] p-1 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-900"
            >
              <Pencil className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              aria-label="Cancelar tarefa"
              title="Cancelar tarefa"
              onClick={() => onDelete(task.id)}
              className="rounded-[6px] p-1 text-neutral-400 hover:bg-[#FFEBEE] hover:text-danger"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
          <span
            className="rounded-full px-2 py-0.5 text-[11px] font-medium"
            style={{ backgroundColor: priorityMeta.bg, color: priorityMeta.text }}
          >
            {priorityMeta.label}
          </span>
        </div>
        <span className="text-xs text-neutral-400">{formatTime(task.dueDate)}</span>
        <Avatar size="sm">
          <AvatarFallback className="bg-brand-bg text-brand">
            {getInitials(task.assignedToName)}
          </AvatarFallback>
        </Avatar>
      </div>
    </div>
  )
}
