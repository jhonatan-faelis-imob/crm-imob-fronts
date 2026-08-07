'use client'

import { Calendar, CheckSquare, List, Plus } from 'lucide-react'
import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { CompleteTaskModal, type CompleteTaskData } from '@/features/tarefas/components/complete-task-modal'
import { TaskDetailSheet } from '@/features/tarefas/components/task-detail-sheet'
import { FiltersBar } from '@/features/tarefas/filters-bar'
import { isWithinRange } from '@/features/tarefas/date-utils'
import { NewTaskDialog, type NewTaskFormValues, type TaskLeadOption } from '@/features/tarefas/new-task-dialog'
import { TaskCalendarView } from '@/features/tarefas/task-calendar-view'
import { TaskListView } from '@/features/tarefas/task-list-view'
import { defaultTaskFilters, type TaskFilters } from '@/features/tarefas/types'
import { buildTaskParams, mapApiTaskToTask, mapCompleteDataToDto, mapFormToTaskDto, type ApiTask } from '@/features/tarefas/api'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/ui/empty-state'
import { toast } from '@/components/ui/toast'
import { tasksService } from '@/services/tasks.service'
import { leadsService } from '@/services/leads.service'
import { usersService } from '@/services/users.service'
import type { Task } from '@/types'

interface ApiUser {
  id: string
  name: string
}

interface TaskSummary {
  overdue: number
  dueToday: number
  pending: number
}

type ViewMode = 'list' | 'calendar'

export default function TarefasPage() {
  const [filters, setFilters] = useState<TaskFilters>(defaultTaskFilters)
  const [viewMode, setViewMode] = useState<ViewMode>('list')
  const [isTaskDialogOpen, setIsTaskDialogOpen] = useState(false)
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [completingTask, setCompletingTask] = useState<Task | null>(null)
  const [openingTask, setOpeningTask] = useState<Task | null>(null)
  const queryClient = useQueryClient()

  const apiParams = buildTaskParams(filters)

  const { data: tasksData, isLoading } = useQuery<{ data: ApiTask[] }>({
    queryKey: ['tasks', apiParams],
    queryFn: () => tasksService.findAll(apiParams),
  })

  const { data: summary } = useQuery<TaskSummary>({
    queryKey: ['tasks-summary'],
    queryFn: tasksService.getSummary,
  })

  const { data: leadsData } = useQuery<{ data: TaskLeadOption[] }>({
    queryKey: ['leads', { limit: '100' }],
    queryFn: () => leadsService.findAll({ limit: '100' }),
  })

  const { data: brokers } = useQuery<ApiUser[]>({
    queryKey: ['users'],
    queryFn: () => usersService.findAll(),
  })

  function invalidateTasks() {
    queryClient.invalidateQueries({ queryKey: ['tasks'] })
    queryClient.invalidateQueries({ queryKey: ['tasks-summary'] })
  }

  const createTask = useMutation({
    mutationFn: (dto: Record<string, unknown>) => tasksService.create(dto),
    onSuccess: () => {
      invalidateTasks()
      toast.add({ title: 'Tarefa criada com sucesso!', type: 'success' })
    },
    onError: () => {
      toast.add({ title: 'Não foi possível criar a tarefa', type: 'error' })
    },
  })

  const updateTask = useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: Record<string, unknown> }) => tasksService.update(id, dto),
    onSuccess: () => {
      invalidateTasks()
      toast.add({ title: 'Tarefa atualizada com sucesso!', type: 'success' })
    },
    onError: () => {
      toast.add({ title: 'Não foi possível salvar as alterações', type: 'error' })
    },
  })

  const completeTask = useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: Record<string, unknown> }) => tasksService.complete(id, dto),
    onSuccess: () => {
      invalidateTasks()
      toast.add({ title: 'Tarefa concluída!', type: 'success' })
    },
    onError: () => {
      toast.add({ title: 'Não foi possível concluir a tarefa', type: 'error' })
    },
  })

  const cancelTask = useMutation({
    mutationFn: (id: string) => tasksService.cancel(id),
    onSuccess: () => {
      invalidateTasks()
      toast.add({ title: 'Tarefa cancelada', type: 'success' })
    },
    onError: () => {
      toast.add({ title: 'Não foi possível cancelar a tarefa', type: 'error' })
    },
  })

  function openNewTaskDialog() {
    setEditingTask(null)
    setIsTaskDialogOpen(true)
  }

  function openEditTaskDialog(task: Task) {
    setEditingTask(task)
    setIsTaskDialogOpen(true)
  }

  function handleSaveTask(data: NewTaskFormValues, taskId?: string) {
    const dto = mapFormToTaskDto(data)
    if (taskId) {
      updateTask.mutate({ id: taskId, dto })
    } else {
      createTask.mutate(dto)
    }
  }

  function handleOpenComplete(task: Task) {
    setCompletingTask(task)
  }

  function handleConfirmComplete(data: CompleteTaskData) {
    if (!completingTask) return
    completeTask.mutate({ id: completingTask.id, dto: mapCompleteDataToDto(data) })
    setCompletingTask(null)
  }

  function handleCancelTask(taskId: string) {
    cancelTask.mutate(taskId)
  }

  const allTasks = (tasksData?.data ?? []).map(mapApiTaskToTask)

  const search = filters.search.trim().toLowerCase()
  const filteredTasks = allTasks.filter((task) => {
    if (search) {
      const matchesTitle = task.title.toLowerCase().includes(search)
      const matchesLead = (task.leadName ?? '').toLowerCase().includes(search)
      if (!matchesTitle && !matchesLead) return false
    }
    if (
      filters.period === 'personalizado' &&
      (filters.periodStart || filters.periodEnd) &&
      !isWithinRange(task.dueDate, filters.periodStart, filters.periodEnd)
    ) {
      return false
    }
    return true
  })

  const leadOptions = leadsData?.data ?? []
  const brokerOptions = brokers ?? []

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-[28px] font-semibold text-neutral-900">Tarefas</h1>
          <p className="mt-1 text-sm text-neutral-400">
            {summary ? `${summary.pending} pendentes · ${summary.overdue} vencidas` : 'Carregando...'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 rounded-[8px] border-[0.5px] border-neutral-200 bg-white p-1">
            <button
              type="button"
              aria-label="Visualizar em lista"
              onClick={() => setViewMode('list')}
              className={`rounded-[6px] p-1.5 ${
                viewMode === 'list' ? 'bg-brand-bg text-brand' : 'text-neutral-400 hover:bg-neutral-100'
              }`}
            >
              <List className="h-4 w-4" />
            </button>
            <button
              type="button"
              aria-label="Visualizar em calendário"
              onClick={() => setViewMode('calendar')}
              className={`rounded-[6px] p-1.5 ${
                viewMode === 'calendar' ? 'bg-brand-bg text-brand' : 'text-neutral-400 hover:bg-neutral-100'
              }`}
            >
              <Calendar className="h-4 w-4" />
            </button>
          </div>

          <button
            type="button"
            onClick={openNewTaskDialog}
            className="inline-flex items-center justify-center gap-2 rounded-[8px] bg-brand px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-brand-dark"
          >
            <Plus className="h-4 w-4" />
            Nova tarefa
          </button>
        </div>
      </div>

      <FiltersBar filters={filters} onChange={setFilters} brokers={brokerOptions} />

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-20 rounded-[16px]" />
          ))}
        </div>
      ) : filteredTasks.length === 0 ? (
        <EmptyState
          icon={<CheckSquare className="h-6 w-6" />}
          title="Nenhuma tarefa encontrada"
          description="Crie tarefas de follow-up para não perder o timing com seus leads."
          action={{ label: '+ Nova tarefa', onClick: openNewTaskDialog }}
        />
      ) : viewMode === 'list' ? (
        <TaskListView
          tasks={filteredTasks}
          onComplete={handleOpenComplete}
          onEdit={openEditTaskDialog}
          onDelete={handleCancelTask}
          onOpenDetail={setOpeningTask}
        />
      ) : (
        <TaskCalendarView
          tasks={filteredTasks}
          onComplete={handleOpenComplete}
          onEdit={openEditTaskDialog}
          onDelete={handleCancelTask}
          onOpenDetail={setOpeningTask}
        />
      )}

      <NewTaskDialog
        open={isTaskDialogOpen}
        onOpenChange={setIsTaskDialogOpen}
        task={editingTask}
        onSave={handleSaveTask}
        leads={leadOptions}
        brokers={brokerOptions}
      />

      <CompleteTaskModal
        task={completingTask}
        open={completingTask !== null}
        onClose={() => setCompletingTask(null)}
        onConfirm={handleConfirmComplete}
      />

      <TaskDetailSheet
        task={openingTask}
        open={openingTask !== null}
        onOpenChange={(next) => !next && setOpeningTask(null)}
        onComplete={handleOpenComplete}
        onEdit={openEditTaskDialog}
        onCancel={handleCancelTask}
      />
    </div>
  )
}
