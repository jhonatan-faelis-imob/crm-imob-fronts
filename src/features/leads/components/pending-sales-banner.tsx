'use client'

import { useQuery } from '@tanstack/react-query'
import { salesService, type PendingLead } from '@/services/sales.service'
import { useAuthStore } from '@/store/auth.store'
import { useStageModals } from '../stage-move-provider'

// GET /sales/pending-leads exige coordenador ou acima
const ALLOWED_ROLES = new Set(['coordenador', 'gerente', 'diretor'])

export function PendingSalesBanner() {
  const role = useAuthStore((state) => state.user?.role)
  const { regularize } = useStageModals()

  const { data: pendingLeads } = useQuery<PendingLead[]>({
    queryKey: ['pending-leads'],
    queryFn: salesService.getPendingLeads,
    enabled: role !== undefined && ALLOWED_ROLES.has(role),
  })

  if (!pendingLeads || pendingLeads.length === 0) return null

  const count = pendingLeads.length

  function handleRegularize() {
    regularize(
      (pendingLeads ?? []).map((lead) => ({
        id: lead.id,
        name: lead.name,
        funnelStageId: lead.funnelStageId,
        interestValue: lead.interestValue === null ? undefined : Number(lead.interestValue),
      })),
    )
  }

  return (
    <div className="flex items-center justify-between gap-3 rounded-[12px] border-[0.5px] border-neutral-200 bg-[#FFF3E0] px-4 py-2.5">
      <p className="text-sm font-medium text-warning">
        {count} {count === 1 ? 'lead em Ganho sem venda registrada' : 'leads em Ganho sem venda registrada'}
      </p>
      <button
        type="button"
        onClick={handleRegularize}
        className="shrink-0 rounded-[8px] border-[1.5px] border-warning px-3 py-1.5 text-sm font-medium text-warning transition-colors hover:bg-white"
      >
        Regularizar
      </button>
    </div>
  )
}
