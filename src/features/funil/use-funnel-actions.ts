'use client'

import { useMutation, useQueryClient, type QueryClient } from '@tanstack/react-query'
import { toast } from '@/components/ui/toast'
import { funnelStagesService } from '@/services/funnel-stages.service'
import { invalidateCadenceQueries } from '@/features/cadencias/invalidate-cadence-queries'
import { plural } from './constants'

/** Etapa mexida: o funil, os leads (colunas do Kanban), tarefas, Meu dia e as cadências */
export function invalidateFunnelQueries(queryClient: QueryClient) {
  queryClient.invalidateQueries({ queryKey: ['funnel-stages'] })
  // ['cadences'], ['tasks'], ['my-day'], ['my-day-summary'] e ['leads'] (entre outras)
  invalidateCadenceQueries(queryClient)
}

export interface MoveLeadsResult {
  moved: number
  cadence: { created: number; cancelled: number }
}

export function moveSummary(result: MoveLeadsResult): string {
  const leads = plural(result.moved, 'lead movido', 'leads movidos')
  const tasks = plural(result.cadence.created, 'tarefa criada', 'tarefas criadas')
  return `${leads} · ${tasks}`
}

/** Mutações da tela de etapas. Quem chama trata o erro (o diálogo mostra a mensagem do servidor) */
export function useFunnelMutations() {
  const queryClient = useQueryClient()
  const settle = () => invalidateFunnelQueries(queryClient)

  const create = useMutation({
    mutationFn: (dto: { name: string; color: string; orderIndex: number }) => funnelStagesService.create(dto),
    onSuccess: () => toast.add({ title: 'Etapa criada', type: 'success' }),
    onSettled: settle,
  })

  const update = useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: { name?: string; color?: string } }) =>
      funnelStagesService.update(id, dto),
    onSuccess: () => toast.add({ title: 'Etapa atualizada', type: 'success' }),
    onSettled: settle,
  })

  const remove = useMutation({
    mutationFn: (id: string): Promise<{ ok: true; removedCadenceSteps: number }> => funnelStagesService.remove(id),
    onSuccess: ({ removedCadenceSteps }) =>
      toast.add({
        title: 'Etapa excluída',
        description:
          removedCadenceSteps > 0
            ? `${plural(removedCadenceSteps, 'passo de cadência removido', 'passos de cadência removidos')}.`
            : undefined,
        type: 'success',
      }),
    onSettled: settle,
  })

  const moveLeads = useMutation({
    mutationFn: ({ fromId, toId }: { fromId: string; toId: string }): Promise<MoveLeadsResult> =>
      funnelStagesService.moveLeads(fromId, toId),
    onSettled: settle,
  })

  return { create, update, remove, moveLeads }
}
