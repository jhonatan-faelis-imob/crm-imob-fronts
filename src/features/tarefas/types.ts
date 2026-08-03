import type { TaskPriority, TaskStatus, TaskType } from '@/types'

export type TaskPeriodFilter = 'todos' | 'hoje' | 'semana' | 'mes' | 'vencidas' | 'personalizado'

export interface TaskFilters {
  status: TaskStatus | 'todas'
  type: TaskType | 'todos'
  priority: TaskPriority | 'todas'
  assignedTo: string
  search: string
  period: TaskPeriodFilter
  periodStart: string
  periodEnd: string
}

export const defaultTaskFilters: TaskFilters = {
  status: 'pendente',
  type: 'todos',
  priority: 'todas',
  assignedTo: 'todos',
  search: '',
  period: 'todos',
  periodStart: '',
  periodEnd: '',
}
