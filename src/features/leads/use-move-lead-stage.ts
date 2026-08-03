'use client'

import { useMutation, useQueryClient, type QueryKey } from '@tanstack/react-query'
import { toast } from '@/components/ui/toast'
import { leadsService } from '@/services/leads.service'
import type { ApiFunnelStage, ApiLead } from './api-mapper'

interface LeadsQueryData {
  data: ApiLead[]
  meta?: unknown
}

interface MoveLeadVariables {
  leadId: string
  stage: ApiFunnelStage
}

interface MoveLeadContext {
  previous: [QueryKey, LeadsQueryData | undefined][]
}

// Hook compartilhado por Kanban, card (menu "Mover para...") e view de lista: todos os
// três leem a mesma cache de queries ['leads', ...], então uma atualização otimista aqui
// já reflete instantaneamente em qualquer um deles sem precisar de estado local próprio.
export function useMoveLeadStage() {
  const queryClient = useQueryClient()

  const mutation = useMutation<unknown, unknown, MoveLeadVariables, MoveLeadContext>({
    mutationFn: ({ leadId, stage }) => leadsService.updateStage(leadId, stage.id),
    onMutate: async ({ leadId, stage }) => {
      await queryClient.cancelQueries({ queryKey: ['leads'] })

      const previous = queryClient.getQueriesData<LeadsQueryData>({ queryKey: ['leads'] })

      queryClient.setQueriesData<LeadsQueryData>({ queryKey: ['leads'] }, (old) => {
        if (!old) return old
        return {
          ...old,
          data: old.data.map((lead) =>
            lead.id === leadId ? { ...lead, funnelStageId: stage.id, funnelStage: stage } : lead,
          ),
        }
      })

      return { previous }
    },
    onError: (_error, _variables, context) => {
      context?.previous.forEach(([queryKey, data]) => {
        queryClient.setQueryData(queryKey, data)
      })
      toast.add({ title: 'Não foi possível mover o lead', type: 'error' })
    },
    onSuccess: (_data, { stage }) => {
      toast.add({ title: `Lead movido para ${stage.name}`, type: 'success' })
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] })
    },
  })

  return {
    moveLead: (leadId: string, stage: ApiFunnelStage) => mutation.mutate({ leadId, stage }),
    isMoving: mutation.isPending,
  }
}
