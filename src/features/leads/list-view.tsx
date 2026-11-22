'use client'

import { Eye, ListTodo, Pencil } from 'lucide-react'
import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import { DocsChip } from '@/features/documentos/components/docs-chip'
import { daysSince, formatCurrency } from '@/lib/utils'
import type { Lead } from '@/types'
import { funnelStagesService } from '@/services/funnel-stages.service'
import { leadSourceMeta } from './sources'
import { resolveLeadStage, type ApiFunnelStage } from './api-mapper'
import { useMoveLeadToStage } from './use-move-lead-to-stage'
import { StagePopover } from './components/stage-popover'

function formatLastContact(lead: Lead) {
  const days = daysSince(lead.lastContactAt ?? lead.createdAt)
  if (days === 0) return 'Hoje'
  return `Há ${days} dia${days > 1 ? 's' : ''}`
}

export function LeadsListView({ leads }: { leads: Lead[] }) {
  const { moveLead } = useMoveLeadToStage()
  const { data: stages } = useQuery<ApiFunnelStage[]>({
    queryKey: ['funnel-stages'],
    queryFn: funnelStagesService.findAll,
  })

  return (
    <div className="overflow-x-auto rounded-[16px] border-[0.5px] border-line bg-paper">
      <table className="w-full min-w-[640px] text-left text-sm">
        <thead>
          <tr className="border-b-[0.5px] border-line text-xs font-medium text-muted-foreground">
            <th className="px-4 py-3">Nome</th>
            <th className="px-4 py-3">Etapa</th>
            <th className="hidden px-4 py-3 md:table-cell">Origem</th>
            <th className="hidden px-4 py-3 md:table-cell">Interesse</th>
            <th className="hidden px-4 py-3 md:table-cell">Responsável</th>
            <th className="hidden px-4 py-3 md:table-cell">Último contato</th>
            <th className="px-4 py-3">Ações</th>
          </tr>
        </thead>
        <tbody>
          {leads.map((lead, index) => {
            const source = leadSourceMeta(lead.source)
            const currentStage = resolveLeadStage(lead, stages ?? [])
            return (
              <tr
                key={lead.id}
                className={`border-b-[0.5px] border-line last:border-0 ${
                  index % 2 === 1 ? 'bg-canvas/50' : 'bg-paper'
                }`}
              >
                <td className="px-4 py-3 font-medium text-brand">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <Link href={`/leads/${lead.id}`} className="hover:text-brand hover:underline">
                      {lead.name}
                    </Link>
                    <DocsChip docs={lead.docs} />
                  </div>
                </td>
                <td className="px-4 py-3">
                  <StagePopover
                    stages={stages ?? []}
                    currentStage={currentStage}
                    onSelect={(stage) => moveLead(lead, stage)}
                  />
                </td>
                <td className="hidden px-4 py-3 text-muted-foreground md:table-cell">{source.label}</td>
                <td className="hidden px-4 py-3 text-muted-foreground md:table-cell">
                  {formatCurrency(lead.interestValue ?? 0)}
                </td>
                <td className="hidden px-4 py-3 text-muted-foreground md:table-cell">
                  {lead.ownerName}
                </td>
                <td className="hidden px-4 py-3 text-muted-foreground md:table-cell">
                  {formatLastContact(lead)}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1">
                    <Link
                      href={`/leads/${lead.id}`}
                      aria-label="Ver lead"
                      className="rounded-[8px] p-1.5 text-muted-foreground hover:bg-canvas hover:text-brand"
                    >
                      <Eye className="h-4 w-4" />
                    </Link>
                    <button
                      type="button"
                      aria-label="Editar lead"
                      className="rounded-[8px] p-1.5 text-muted-foreground hover:bg-canvas hover:text-brand"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      aria-label="Nova tarefa"
                      className="rounded-[8px] p-1.5 text-muted-foreground hover:bg-canvas hover:text-brand"
                    >
                      <ListTodo className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
