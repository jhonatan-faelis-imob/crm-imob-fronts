'use client'

import { useMutation, useQueryClient, type QueryKey } from '@tanstack/react-query'
import { toast } from '@/components/ui/toast'
import { invalidateMyDayQueries } from '@/features/meu-dia/invalidate-my-day-queries'
import { cadenceToastDescription } from '@/features/cadencias/constants'
import { invalidateGoalQueries } from '@/features/metas/invalidate-goal-queries'
import { leadsService, type StageChangeResponse } from '@/services/leads.service'
import type { Lead } from '@/types'
import type { ApiFunnelStage, ApiLead } from './api-mapper'
import type { SaleLead } from './components/register-sale-modal'
import { useStageModals, type LeaveWonDecision } from './stage-move-provider'
import { isLostStage, isWonStage } from './utils/stage-utils'

interface LeadsQueryData {
  data: ApiLead[]
  meta?: unknown
}

interface MoveLeadVariables {
  leadId: string
  stage: ApiFunnelStage
}

interface MoveLeadContext {
  previousLists: [QueryKey, LeadsQueryData | undefined][]
  previousLead: ApiLead | undefined
}

type MovableLead = SaleLead & Pick<Lead, 'status'>

// Único ponto de decisão de mudança de etapa, usado por Kanban, card ("Mover para..."),
// lista e detalhe. Ganho e Perdido só abrem o modal: a etapa não muda (nem de forma
// otimista) até a confirmação, então cancelar não tem nada a desfazer.
export function useMoveLeadToStage() {
  const queryClient = useQueryClient()
  const { requestSale, requestLost, confirmLeaveWon, cancelSale } = useStageModals()

  const mutation = useMutation<StageChangeResponse, unknown, MoveLeadVariables, MoveLeadContext>({
    mutationFn: ({ leadId, stage }) => leadsService.updateStage(leadId, stage.id),
    onMutate: async ({ leadId, stage }) => {
      await queryClient.cancelQueries({ queryKey: ['leads'] })
      await queryClient.cancelQueries({ queryKey: ['lead', leadId] })

      const previousLists = queryClient.getQueriesData<LeadsQueryData>({ queryKey: ['leads'] })
      const previousLead = queryClient.getQueryData<ApiLead>(['lead', leadId])

      queryClient.setQueriesData<LeadsQueryData>({ queryKey: ['leads'] }, (old) => {
        if (!old) return old
        return {
          ...old,
          data: old.data.map((lead) =>
            lead.id === leadId ? { ...lead, funnelStageId: stage.id, funnelStage: stage } : lead,
          ),
        }
      })
      queryClient.setQueryData<ApiLead>(['lead', leadId], (old) =>
        old ? { ...old, funnelStageId: stage.id, funnelStage: stage } : old,
      )

      return { previousLists, previousLead }
    },
    onError: (_error, { leadId }, context) => {
      context?.previousLists.forEach(([queryKey, data]) => {
        queryClient.setQueryData(queryKey, data)
      })
      if (context?.previousLead) queryClient.setQueryData(['lead', leadId], context.previousLead)
      toast.add({ title: 'Não foi possível mover o lead', type: 'error' })
    },
    onSuccess: (data, { stage }) => {
      toast.add({
        title: `Lead movido para ${stage.name}`,
        description: cadenceToastDescription(data.cadence),
        type: 'success',
      })
    },
    onSettled: (_data, _error, { leadId }) => {
      // Inclui tasks, my-day, my-day-summary, goals-auto-fill e ['lead', id]: a cadência cria e cancela tarefas
      invalidateMyDayQueries(queryClient, leadId)
      invalidateGoalQueries(queryClient)
    },
  })

  // Quem sai de Ganho pode ter venda ativa; Lead.status já vem derivado da etapa
  async function askAboutSale(lead: MovableLead): Promise<LeaveWonDecision> {
    return lead.status === 'ganho' ? confirmLeaveWon(lead.id) : { proceed: true }
  }

  async function markLost(lead: MovableLead) {
    const decision = await askAboutSale(lead)
    if (decision.proceed) requestLost(lead.id, decision.cancelSaleId)
  }

  return {
    moveLead: async (lead: MovableLead, stage: ApiFunnelStage) => {
      if (lead.funnelStageId === stage.id) return

      if (isWonStage(stage.name)) {
        requestSale(lead, stage)
        return
      }
      if (isLostStage(stage.name)) {
        await markLost(lead)
        return
      }

      const decision = await askAboutSale(lead)
      if (!decision.proceed) return
      if (decision.cancelSaleId && !(await cancelSale(decision.cancelSaleId))) return

      mutation.mutate({ leadId: lead.id, stage })
    },
    markLost,
    isMoving: mutation.isPending,
  }
}
