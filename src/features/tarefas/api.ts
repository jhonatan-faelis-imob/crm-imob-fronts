import type { Task } from '@/types'
import type { CompleteTaskData } from './components/complete-task-modal'
import type { NewTaskFormValues } from './new-task-dialog'
import type { TaskFilters, TaskPeriodFilter } from './types'

export interface ApiTask {
  id: string
  organizationId: string
  leadId: string | null
  assignedTo: string
  createdBy: string
  parentTaskId: string | null
  title: string
  description: string | null
  type: string
  priority: string
  status: string
  dueDate: string
  completedAt: string | null
  hasNextTask: boolean
  completionNotes: string | null
  createdAt: string
  updatedAt: string
  assignee?: { id: string; name: string; avatarUrl: string | null } | null
  lead?: { id: string; name: string } | null
  parentTask?: { id: string; title: string } | null
}

// O backend não guarda um "template" da próxima tarefa (nextTaskType/Title/DaysAfter) —
// só a flag hasNextTask. Esses três campos só existem na UI até o backend ganhar suporte.
export function mapApiTaskToTask(task: ApiTask): Task {
  return {
    id: task.id,
    organizationId: task.organizationId,
    leadId: task.leadId ?? undefined,
    leadName: task.lead?.name,
    assignedTo: task.assignedTo,
    assignedToName: task.assignee?.name ?? 'Sem responsável',
    createdBy: task.createdBy,
    parentTaskId: task.parentTaskId ?? undefined,
    title: task.title,
    description: task.description ?? undefined,
    type: task.type as Task['type'],
    priority: task.priority as Task['priority'],
    status: task.status as Task['status'],
    dueDate: task.dueDate,
    completedAt: task.completedAt ?? undefined,
    hasNextTask: task.hasNextTask,
    createdAt: task.createdAt,
    updatedAt: task.updatedAt,
  }
}

const PERIOD_TO_API: Partial<Record<TaskPeriodFilter, string>> = {
  hoje: 'today',
  semana: 'week',
  mes: 'month',
  vencidas: 'overdue',
}

export function buildTaskParams(filters: TaskFilters): Record<string, string> {
  const params: Record<string, string> = { limit: '100' }
  if (filters.status !== 'todas') params.status = filters.status
  if (filters.type !== 'todos') params.type = filters.type
  if (filters.priority !== 'todas') params.priority = filters.priority
  if (filters.assignedTo !== 'todos') params.assignedTo = filters.assignedTo

  const period = PERIOD_TO_API[filters.period]
  if (period) params.period = period

  return params
}

function combineDateAndTime(date: string, time: string) {
  return new Date(`${date}T${time}`).toISOString()
}

export function mapFormToTaskDto(data: NewTaskFormValues): Record<string, unknown> {
  return {
    leadId: data.leadId || undefined,
    assignedTo: data.assignedTo,
    title: data.title,
    description: data.description || undefined,
    type: data.type,
    priority: data.priority,
    dueDate: combineDateAndTime(data.date, data.time),
    hasNextTask: data.hasNextTask,
  }
}

export function mapCompleteDataToDto(data: CompleteTaskData): Record<string, unknown> {
  return {
    completionNotes: data.notes.trim() || undefined,
    createNextTask: data.hasNextTask,
    nextTaskType: data.nextTask?.type,
    nextTaskTitle: data.nextTask?.title,
    nextTaskDueDate: data.nextTask ? combineDateAndTime(data.nextTask.dueDate, data.nextTask.dueTime) : undefined,
  }
}
