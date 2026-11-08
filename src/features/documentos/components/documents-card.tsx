'use client'

import { ProgressBar } from '@/features/metas/progress-bar'
import type { LeadDocsSummary } from '@/types'

// docs nulo = o checklist nunca foi aberto (o GET da aba é que gera os itens)
export function DocumentsCard({ docs, onOpen }: { docs: LeadDocsSummary | null; onOpen: () => void }) {
  const percent =
    docs && docs.requiredTotal > 0 ? Math.round((docs.requiredApproved / docs.requiredTotal) * 100) : null

  return (
    <div className="rounded-[16px] border-[0.5px] border-neutral-200 bg-white p-5">
      <div className="flex items-baseline justify-between gap-2">
        <h3 className="text-sm font-semibold text-neutral-900">Documentos</h3>
        {docs && docs.requiredTotal > 0 && (
          <span className="text-xs font-medium text-neutral-600">
            {docs.requiredApproved}/{docs.requiredTotal} aprovados
          </span>
        )}
      </div>

      {docs ? (
        <>
          <ProgressBar value={percent ?? 0} className="mt-3" />
          <p className="mt-2 text-xs text-neutral-400">
            {docs.pendingRequired > 0
              ? `${docs.pendingRequired} ${docs.pendingRequired === 1 ? 'obrigatório pendente' : 'obrigatórios pendentes'}`
              : 'Nenhum obrigatório pendente'}
          </p>
        </>
      ) : (
        <p className="mt-3 text-sm text-neutral-400">Checklist ainda não iniciado</p>
      )}

      <button
        type="button"
        onClick={onOpen}
        className="mt-3 h-11 w-full rounded-[8px] border-[0.5px] border-neutral-200 px-4 text-sm font-medium text-neutral-600 transition-colors hover:bg-neutral-100 sm:h-10"
      >
        {docs ? 'Ver checklist' : 'Iniciar'}
      </button>
    </div>
  )
}
