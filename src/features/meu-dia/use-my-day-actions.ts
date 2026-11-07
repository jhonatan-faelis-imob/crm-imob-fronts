import { useMutation, useQueryClient, type QueryKey } from '@tanstack/react-query'
import { toast } from '@/components/ui/toast'
import { interactionsService } from '@/services/interactions.service'
import { tasksService } from '@/services/tasks.service'
import type { MyDayItem, MyDayResponse, TaskType } from '@/types'
import { isDueByToday } from './constants'
import { invalidateMyDayQueries } from './invalidate-my-day-queries'

interface ItemTarget {
  itemKey: string
  leadId?: string
}

interface CompleteVariables extends ItemTarget {
  taskId: string
  dto: Record<string, unknown>
}

interface PostponeVariables extends ItemTarget {
  taskId: string
  dueDate: Date
}

interface ScheduleVariables extends ItemTarget {
  leadId: string
  leadName: string
  dueDate: Date
}

export interface ContactVariables extends ItemTarget {
  leadId: string
  type: TaskType
  notes: string
  nextTask?: { title: string; dueDate: Date }
}

type Snapshot = [QueryKey, MyDayResponse | undefined][]

// Concluir uma tarefa só tira o lead da lista se não sobrar outra para hoje
function withoutTarget(items: MyDayItem[], itemKey: string, taskId?: string) {
  return items.flatMap((item) => {
    if (item.key !== itemKey) return [item]
    const tasks = item.tasks.filter((task) => task.id !== taskId)
    return taskId && tasks.some(isDueByToday) ? [{ ...item, tasks }] : []
  })
}

function useOptimisticAction<Variables extends ItemTarget, Result>(
  mutationFn: (variables: Variables) => Promise<Result>,
  errorTitle: string,
  onDone: (result: Result) => void,
) {
  const queryClient = useQueryClient()

  return useMutation<Result, unknown, Variables, Snapshot>({
    mutationFn,
    onMutate: async (variables) => {
      await queryClient.cancelQueries({ queryKey: ['my-day'] })
      const snapshot = queryClient.getQueriesData<MyDayResponse>({ queryKey: ['my-day'] })
      const taskId = 'taskId' in variables ? String(variables.taskId) : undefined

      queryClient.setQueriesData<MyDayResponse>({ queryKey: ['my-day'] }, (old) =>
        old ? { ...old, items: withoutTarget(old.items, variables.itemKey, taskId) } : old,
      )
      return snapshot
    },
    onError: (_error, _variables, snapshot) => {
      snapshot?.forEach(([queryKey, data]) => queryClient.setQueryData(queryKey, data))
      toast.add({ title: errorTitle, type: 'error' })
    },
    onSuccess: onDone,
    onSettled: (_result, _error, { leadId }) => invalidateMyDayQueries(queryClient, leadId),
  })
}

// O dono da fila recebe a tarefa: quem vê a tela de outro corretor age em nome dele
export function useMyDayActions(viewingUserId?: string) {
  const completeTask = useOptimisticAction(
    ({ taskId, dto }: CompleteVariables) => tasksService.complete(taskId, dto),
    'Não foi possível concluir a tarefa',
    () => toast.add({ title: 'Tarefa concluída', type: 'success' }),
  )

  const postponeTask = useOptimisticAction(
    ({ taskId, dueDate }: PostponeVariables) => tasksService.update(taskId, { dueDate: dueDate.toISOString() }),
    'Não foi possível adiar a tarefa',
    () => toast.add({ title: 'Tarefa adiada', type: 'success' }),
  )

  const scheduleReturn = useOptimisticAction(
    ({ leadId, leadName, dueDate }: ScheduleVariables) =>
      tasksService.create({
        leadId,
        assignedTo: viewingUserId,
        title: `Retornar contato: ${leadName}`,
        type: 'ligacao',
        dueDate: dueDate.toISOString(),
      }),
    'Não foi possível agendar o retorno',
    () => toast.add({ title: 'Retorno agendado', type: 'success' }),
  )

  const registerContact = useOptimisticAction(
    async ({ leadId, type, notes, nextTask }: ContactVariables) => {
      await interactionsService.create({ leadId, type, notes })
      if (!nextTask) return true

      try {
        await tasksService.create({
          leadId,
          assignedTo: viewingUserId,
          title: nextTask.title,
          type: 'ligacao',
          dueDate: nextTask.dueDate.toISOString(),
        })
        return true
      } catch {
        return false
      }
    },
    'Não foi possível registrar o contato',
    (isComplete) =>
      isComplete
        ? toast.add({ title: 'Contato registrado', type: 'success' })
        : toast.add({ title: 'Contato registrado, mas a tarefa não foi criada', type: 'warning' }),
  )

  return { completeTask, postponeTask, scheduleReturn, registerContact }
}
