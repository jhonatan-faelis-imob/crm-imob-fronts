'use client'

import { useMutation, useQueryClient, type QueryKey } from '@tanstack/react-query'
import { toast } from '@/components/ui/toast'
import { leadsService } from '@/services/leads.service'
import type { ApiFunnelStage, ApiLead } from './api-mapper'
import type { SaleLead } from './components/register-sale-modal'
import { useStageModals } from './stage-move-provider'
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

// Único ponto de decisão de mudança de etapa, usado por Kanban, card ("Mover para..."),
// lista e detalhe. Ganho e Perdido só abrem o modal: a etapa não muda (nem de forma
// otimista) até a confirmação, então cancelar não tem nada a desfazer.
export function useMoveLeadToStage() {
  const queryClient = useQueryClient()
  const { requestSale, requestLost } = useStageModals()

  const mutation = useMutation<unknown, unknown, MoveLeadVariables, MoveLeadContext>({
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
    onSuccess: (_data, { stage }) => {
      toast.add({ title: `Lead movido para ${stage.name}`, type: 'success' })
    },
    onSettled: (_data, _error, { leadId }) => {
      queryClient.invalidateQueries({ queryKey: ['leads'] })
      queryClient.invalidateQueries({ queryKey: ['lead', leadId] })
    },
  })

  return {
    moveLead: (lead: SaleLead, stage: ApiFunnelStage) => {
      if (lead.funnelStageId === stage.id) return

      if (isWonStage(stage.name)) {
        requestSale(lead, stage)
        return
      }
      if (isLostStage(stage.name)) {
        requestLost(lead.id)
        return
      }
      mutation.mutate({ leadId: lead.id, stage })
    },
    isMoving: mutation.isPending,
  }
}
