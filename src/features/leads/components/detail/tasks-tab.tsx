'use client'

import {
  Check,
  Home,
  Mail,
  MessageCircle,
  MoreHorizontal,
  Phone,
  Plus,
  Trash2,
  Users,
  type LucideIcon,
} from 'lucide-react'
import { useState } from 'react'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import type { Task, TaskPriority, TaskType } from '@/types'
import { formatDateTimeBR } from './format'

const TASK_TYPE_META: Record<TaskType, { label: string; icon: LucideIcon }> = {
  ligacao: { label: 'Ligação', icon: Phone },
  whatsapp: { label: 'WhatsApp', icon: MessageCircle },
  email: { label: 'E-mail', icon: Mail },
  visita: { label: 'Visita', icon: Home },
  reuniao: { label: 'Reunião', icon: Users },
  outro: { label: 'Outro', icon: MoreHorizontal },
}

const PRIORITY_META: Record<TaskPriority, { label: string; bg: string; text: string }> = {
  alta: { label: 'Alta', bg: '#FFEBEE', text: '#D93B30' },
  media: { label: 'Média', bg: '#FFF3E0', text: '#C45800' },
  baixa: { label: 'Baixa', bg: '#F7F7F7', text: '#767676' },
}

const FILTERS: { value: 'pendente' | 'concluida' | 'todas'; label: string }[] = [
  { value: 'pendente', label: 'Pendentes' },
  { value: 'concluida', label: 'Concluídas' },
  { value: 'todas', label: 'Todas' },
]

function isOverdue(task: Task) {
  return task.status === 'pendente' && new Date(task.dueDate).getTime() < Date.now()
}

export function TasksTab({
  tasks,
  newTaskId,
  onOpenNewTask,
  onCompleteRequest,
  onDelete,
  onOpenDetail,
}: {
  tasks: Task[]
  newTaskId?: string | null
  onOpenNewTask: () => void
  onCompleteRequest: (task: Task) => void
  onDelete: (taskId: string) => void
  onOpenDetail: (task: Task) => void
}) {
  const [filter, setFilter] = useState<'pendente' | 'concluida' | 'todas'>('pendente')
  const [deletingTask, setDeletingTask] = useState<Task | null>(null)

  const filtered = tasks.filter((task) => filter === 'todas' || task.status === filter)

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-1 rounded-[8px] border-[0.5px] border-neutral-200 bg-white p-1">
          {FILTERS.map(({ value, label }) => (
            <button
              key={value}
              type="button"
              onClick={() => setFilter(value)}
              className={`rounded-[6px] px-3 py-1.5 text-sm font-medium transition-colors ${
                filter === value ? 'bg-brand-bg text-brand' : 'text-neutral-400 hover:bg-neutral-100'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={onOpenNewTask}
          className="inline-flex items-center gap-1.5 rounded-[8px] bg-brand px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-dark"
        >
          <Plus className="h-4 w-4" />
          Nova tarefa
        </button>
      </div>

      <div className="space-y-3">
        {filtered.map((task) => {
          const meta = TASK_TYPE_META[task.type]
          const Icon = meta.icon
          const priority = PRIORITY_META[task.priority]
          const overdue = isOverdue(task)
          const parentTask = task.parentTaskId ? tasks.find((item) => item.id === task.parentTaskId) : undefined

          const isCancelled = task.status === 'cancelada'

          return (
            <div
              key={task.id}
              role="button"
              tabIndex={0}
              onClick={() => onOpenDetail(task)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') onOpenDetail(task)
              }}
              className={`flex cursor-pointer items-start gap-3 rounded-[16px] border-[0.5px] bg-white p-4 transition-colors hover:bg-[#FAFAFA] ${
                overdue ? 'border-danger' : 'border-neutral-200'
              } ${isCancelled ? 'opacity-60' : ''}`}
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-neutral-100 text-neutral-600">
                <Icon className="h-4 w-4" />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm font-medium text-neutral-900">{task.title}</p>
                  <span
                    className="rounded-full px-2 py-0.5 text-[11px] font-medium"
                    style={{ backgroundColor: priority.bg, color: priority.text }}
                  >
                    {priority.label}
                  </span>
                  {task.id === newTaskId && (
                    <span className="animate-pulse rounded-full bg-brand px-2 py-0.5 text-[11px] font-medium text-white">
                      Nova
                    </span>
                  )}
                  {overdue && (
                    <span className="rounded-full bg-[#FFEBEE] px-2 py-0.5 text-[11px] font-medium text-danger">
                      Vencida
                    </span>
                  )}
                </div>
                <p className={`mt-1 text-xs ${overdue ? 'font-medium text-danger' : 'text-neutral-400'}`}>
                  {task.assignedToName} · {formatDateTimeBR(task.dueDate)}
                </p>
                {parentTask && <p className="mt-1 text-xs text-neutral-400">Originada de: {parentTask.title}</p>}
              </div>
              <div className="flex shrink-0 items-center gap-1">
                {task.status === 'pendente' && (
                  <button
                    type="button"
                    aria-label="Concluir tarefa"
                    onClick={(event) => {
                      event.stopPropagation()
                      onCompleteRequest(task)
                    }}
                    className="rounded-[8px] p-1.5 text-neutral-400 hover:bg-[#E8F5E9] hover:text-success"
                  >
                    <Check className="h-4 w-4" />
                  </button>
                )}
                {task.status === 'pendente' && (
                  <button
                    type="button"
                    aria-label="Excluir tarefa"
                    onClick={(event) => {
                      event.stopPropagation()
                      setDeletingTask(task)
                    }}
                    className="rounded-[8px] p-1.5 text-neutral-400 hover:bg-[#FFEBEE] hover:text-danger"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
          )
        })}

        {filtered.length === 0 && (
          <p className="rounded-[16px] border-[0.5px] border-dashed border-neutral-200 p-6 text-center text-sm text-neutral-400">
            Nenhuma tarefa nesta visualização.
          </p>
        )}
      </div>

      <ConfirmDialog
        open={deletingTask !== null}
        onOpenChange={(next) => !next && setDeletingTask(null)}
        title="Excluir tarefa?"
        description={
          deletingTask && (
            <>
              A tarefa <strong>&quot;{deletingTask.title}&quot;</strong> será excluída e removida da lista de
              pendentes. Essa ação não pode ser desfeita.
            </>
          )
        }
        confirmLabel="Sim, excluir"
        onConfirm={() => {
          if (!deletingTask) return
          onDelete(deletingTask.id)
          setDeletingTask(null)
        }}
      />
    </div>
  )
}
