'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { isAxiosError } from 'axios'
import { createContext, useContext, useState, type ReactNode } from 'react'
import { toast } from '@/components/ui/toast'
import { funnelStagesService } from '@/services/funnel-stages.service'
import { leadsService } from '@/services/leads.service'
import { salesService, type CreateSaleDto } from '@/services/sales.service'
import type { ApiFunnelStage } from './api-mapper'
import { LostReasonModal } from './components/lost-reason-modal'
import { RegisterSaleModal, type SaleLead } from './components/register-sale-modal'
import { isWonStage } from './utils/stage-utils'

interface SaleTarget {
  lead: SaleLead
  stage: ApiFunnelStage | undefined
}

interface StageModalsContextValue {
  requestSale: (lead: SaleLead, stage: ApiFunnelStage) => void
  requestLost: (leadId: string) => void
  regularize: (leads: SaleLead[]) => void
}

const StageModalsContext = createContext<StageModalsContextValue | null>(null)

// Telas que leem vendas mas não seguem o prefixo reports-*
const SALE_QUERY_KEYS = new Set(['broker-ranking', 'sales-by-property', 'sales-history'])

function isSaleReportKey(key: unknown) {
  return typeof key === 'string' && (key.startsWith('reports-') || SALE_QUERY_KEYS.has(key))
}

// Montado em leads/layout.tsx: uma única instância de cada modal atende a página de Leads
// (Kanban, card, lista) e o detalhe do lead, em vez de um modal por card.
export function StageMoveProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient()
  const [queue, setQueue] = useState<SaleTarget[]>([])
  const [queueSize, setQueueSize] = useState(0)
  const [lostLeadId, setLostLeadId] = useState<string | null>(null)

  const { data: stages } = useQuery<ApiFunnelStage[]>({
    queryKey: ['funnel-stages'],
    queryFn: funnelStagesService.findAll,
  })

  const current = queue.at(0)

  function advance() {
    setQueue((items) => items.slice(1))
  }

  function invalidateSaleQueries(leadId: string) {
    for (const queryKey of [['leads'], ['lead', leadId], ['goals'], ['dashboard'], ['pending-leads'], ['properties']]) {
      queryClient.invalidateQueries({ queryKey })
    }
    queryClient.invalidateQueries({ predicate: (query) => isSaleReportKey(query.queryKey[0]) })
  }

  const confirmSale = useMutation({
    mutationFn: async ({ target, dto }: { target: SaleTarget; dto: CreateSaleDto }) => {
      let isDuplicate = false
      try {
        await salesService.create(dto)
      } catch (error) {
        if (!isAxiosError(error) || error.response?.status !== 409) throw error
        isDuplicate = true
      }

      const { lead, stage } = target
      if (!stage || stage.id === lead.funnelStageId) return { isDuplicate, stageMoved: true }

      try {
        await leadsService.updateStage(lead.id, stage.id)
        return { isDuplicate, stageMoved: true }
      } catch {
        return { isDuplicate, stageMoved: false }
      }
    },
    onSuccess: ({ isDuplicate, stageMoved }, { target }) => {
      invalidateSaleQueries(target.lead.id)
      advance()

      if (!stageMoved) {
        toast.add({
          title: 'O lead não mudou de etapa',
          description: isDuplicate
            ? 'Este lead já possui uma venda registrada. Tente mover novamente.'
            : 'A venda foi registrada. Tente mover o lead novamente.',
          type: 'warning',
        })
      } else if (isDuplicate) {
        // Sem isso, um lead que saiu de Ganho por engano nunca conseguiria voltar
        toast.add({
          title: 'Este lead já possui uma venda registrada',
          description: 'Nenhuma venda nova foi criada. A venda existente foi mantida.',
          type: 'warning',
        })
      } else {
        toast.add({ title: 'Venda registrada com sucesso!', type: 'success' })
      }
    },
    onError: () => {
      toast.add({ title: 'Não foi possível registrar a venda', type: 'error' })
    },
  })

  const markAsLost = useMutation({
    mutationFn: ({ leadId, reason }: { leadId: string; reason: string }) => leadsService.markAsLost(leadId, reason),
    onSuccess: (_data, { leadId }) => {
      queryClient.invalidateQueries({ queryKey: ['leads'] })
      queryClient.invalidateQueries({ queryKey: ['lead', leadId] })
      setLostLeadId(null)
      toast.add({ title: 'Lead marcado como perdido', type: 'success' })
    },
    onError: () => {
      toast.add({ title: 'Não foi possível marcar o lead como perdido', type: 'error' })
    },
  })

  function requestSale(lead: SaleLead, stage: ApiFunnelStage) {
    setQueueSize(1)
    setQueue([{ lead, stage }])
  }

  function regularize(leads: SaleLead[]) {
    const wonStage = stages?.find((stage) => isWonStage(stage.name))
    setQueueSize(leads.length)
    setQueue(leads.map((lead) => ({ lead, stage: wonStage })))
  }

  return (
    <StageModalsContext.Provider value={{ requestSale, requestLost: setLostLeadId, regularize }}>
      {children}
      <RegisterSaleModal
        lead={current?.lead}
        progressLabel={queueSize > 1 ? `${queueSize - queue.length + 1} de ${queueSize}` : undefined}
        onCancel={advance}
        onConfirm={(dto) => {
          if (current) confirmSale.mutate({ target: current, dto })
        }}
        isSubmitting={confirmSale.isPending}
      />
      {/* key: o modal guarda o motivo em estado local, que não pode vazar para o próximo lead */}
      <LostReasonModal
        key={lostLeadId}
        open={lostLeadId !== null}
        onOpenChange={(nextOpen) => {
          if (!nextOpen) setLostLeadId(null)
        }}
        onConfirm={(reason) => {
          if (lostLeadId) markAsLost.mutate({ leadId: lostLeadId, reason })
        }}
        isSubmitting={markAsLost.isPending}
      />
    </StageModalsContext.Provider>
  )
}

export function useStageModals() {
  const context = useContext(StageModalsContext)
  if (!context) throw new Error('useStageModals must be used within StageMoveProvider')
  return context
}
