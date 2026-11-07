'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { isAxiosError } from 'axios'
import { createContext, useContext, useState, type ReactNode } from 'react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { toast } from '@/components/ui/toast'
import { invalidateMyDayQueries } from '@/features/meu-dia/invalidate-my-day-queries'
import { invalidateGoalQueries } from '@/features/metas/invalidate-goal-queries'
import { formatCurrency } from '@/lib/utils'
import { funnelStagesService } from '@/services/funnel-stages.service'
import { leadsService, type ActiveSale } from '@/services/leads.service'
import { salesService, type CreateSaleDto } from '@/services/sales.service'
import { useAuthStore } from '@/store/auth.store'
import type { ApiFunnelStage } from './api-mapper'
import { LostReasonModal } from './components/lost-reason-modal'
import { RegisterSaleModal, type SaleLead } from './components/register-sale-modal'
import { isWonStage } from './utils/stage-utils'

interface SaleTarget {
  lead: SaleLead
  stage: ApiFunnelStage | undefined
}

export type LeaveWonDecision = { proceed: false; cancelSaleId?: undefined } | { proceed: true; cancelSaleId?: string }

interface StageModalsContextValue {
  requestSale: (lead: SaleLead, stage: ApiFunnelStage) => void
  requestLost: (leadId: string, cancelSaleId?: string) => void
  confirmLeaveWon: (leadId: string) => Promise<LeaveWonDecision>
  cancelSale: (saleId: string) => Promise<boolean>
  regularize: (leads: SaleLead[]) => void
}

const StageModalsContext = createContext<StageModalsContextValue | null>(null)

// Espelha SalesService.updateStatus: o corretor só cancela a venda que é dele
const MANAGE_SALE_ROLES = new Set(['coordenador', 'gerente', 'diretor'])

// Montado em leads/layout.tsx: uma única instância de cada modal atende a página de Leads
// (Kanban, card, lista) e o detalhe do lead, em vez de um modal por card.
export function StageMoveProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient()
  const user = useAuthStore((state) => state.user)
  const [queue, setQueue] = useState<SaleTarget[]>([])
  const [queueSize, setQueueSize] = useState(0)
  const [lostTarget, setLostTarget] = useState<{ leadId: string; cancelSaleId?: string } | null>(null)
  const [leaveWon, setLeaveWon] = useState<{
    sale: ActiveSale
    resolve: (decision: LeaveWonDecision) => void
  } | null>(null)

  const { data: stages } = useQuery<ApiFunnelStage[]>({
    queryKey: ['funnel-stages'],
    queryFn: funnelStagesService.findAll,
  })

  const current = queue.at(0)
  const canCancelSale =
    !!user &&
    (MANAGE_SALE_ROLES.has(user.role) || (user.role === 'corretor' && leaveWon?.sale.brokerId === user.id))

  function advance() {
    setQueue((items) => items.slice(1))
  }

  function invalidateLeadQueries(leadId: string) {
    for (const queryKey of [['leads'], ['lead', leadId], ['pending-leads'], ['properties']]) {
      queryClient.invalidateQueries({ queryKey })
    }
    invalidateGoalQueries(queryClient)
    invalidateMyDayQueries(queryClient, leadId)
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
      invalidateLeadQueries(target.lead.id)
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

  async function cancelSale(saleId: string) {
    try {
      await salesService.updateStatus(saleId, 'cancelado', 'Lead movido para outra etapa')
      invalidateGoalQueries(queryClient)
      queryClient.invalidateQueries({ queryKey: ['pending-leads'] })
      toast.add({ title: 'Venda cancelada', type: 'success' })
      return true
    } catch {
      toast.add({ title: 'Não foi possível cancelar a venda', type: 'error' })
      return false
    }
  }

  const markAsLost = useMutation({
    mutationFn: async ({ leadId, reason, cancelSaleId }: { leadId: string; reason: string; cancelSaleId?: string }) => {
      if (cancelSaleId && !(await cancelSale(cancelSaleId))) return false
      await leadsService.markAsLost(leadId, reason)
      return true
    },
    onSuccess: (wasMarked, { leadId }) => {
      if (!wasMarked) return
      invalidateLeadQueries(leadId)
      setLostTarget(null)
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

  async function confirmLeaveWon(leadId: string): Promise<LeaveWonDecision> {
    let sale: ActiveSale | null
    try {
      sale = await leadsService.getActiveSale(leadId)
    } catch {
      toast.add({ title: 'Não foi possível verificar a venda deste lead', type: 'error' })
      return { proceed: false }
    }
    if (!sale) return { proceed: true }

    const activeSale = sale
    return new Promise((resolve) => setLeaveWon({ sale: activeSale, resolve }))
  }

  function answerLeaveWon(decision: LeaveWonDecision) {
    leaveWon?.resolve(decision)
    setLeaveWon(null)
  }

  return (
    <StageModalsContext.Provider
      value={{
        requestSale,
        requestLost: (leadId, cancelSaleId) => setLostTarget({ leadId, cancelSaleId }),
        confirmLeaveWon,
        cancelSale,
        regularize,
      }}
    >
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
        key={lostTarget?.leadId}
        open={lostTarget !== null}
        onOpenChange={(nextOpen) => {
          if (!nextOpen) setLostTarget(null)
        }}
        onConfirm={(reason) => {
          if (lostTarget) markAsLost.mutate({ ...lostTarget, reason })
        }}
        isSubmitting={markAsLost.isPending}
      />
      <AlertDialog
        open={leaveWon !== null}
        onOpenChange={(nextOpen) => {
          if (!nextOpen) answerLeaveWon({ proceed: false })
        }}
      >
        <AlertDialogContent className="w-[calc(100%-2rem)] gap-0 rounded-2xl border-[0.5px] border-neutral-200 bg-white p-0 ring-0">
          <AlertDialogHeader className="p-4 sm:p-6">
            <AlertDialogTitle>Lead com venda registrada</AlertDialogTitle>
            <AlertDialogDescription>
              Este lead tem uma venda de {formatCurrency(Number(leaveWon?.sale.saleValue ?? 0))} registrada.{' '}
              {canCancelSale
                ? 'Deseja cancelar a venda? Ela deixará de contar nas metas e no ranking.'
                : 'Ela continuará contando nas metas e no ranking. Só um coordenador pode cancelar a venda.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mx-0 mb-0 flex-col gap-2 rounded-b-2xl border-t-[0.5px] border-neutral-200 bg-white p-4 sm:flex-col sm:p-6">
            {canCancelSale && (
              <AlertDialogAction
                onClick={() => answerLeaveWon({ proceed: true, cancelSaleId: leaveWon?.sale.id })}
                className="h-11 w-full rounded-[8px] bg-danger px-4 text-white hover:bg-danger hover:opacity-90 sm:h-10"
              >
                Cancelar a venda e mover
              </AlertDialogAction>
            )}
            <AlertDialogAction
              onClick={() => answerLeaveWon({ proceed: true })}
              className="h-11 w-full rounded-[8px] bg-brand px-4 text-white hover:bg-brand-dark sm:h-10"
            >
              Manter a venda e mover
            </AlertDialogAction>
            <AlertDialogCancel className="h-11 w-full rounded-[8px] border-[1.5px] border-neutral-200 px-4 text-neutral-600 sm:h-10">
              Voltar
            </AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </StageModalsContext.Provider>
  )
}

export function useStageModals() {
  const context = useContext(StageModalsContext)
  if (!context) throw new Error('useStageModals must be used within StageMoveProvider')
  return context
}
