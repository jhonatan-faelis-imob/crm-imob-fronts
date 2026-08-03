'use client'

import { Eye, ListTodo, Pencil } from 'lucide-react'
import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import { daysSince, formatCurrency } from '@/lib/utils'
import type { Lead } from '@/types'
import { funnelStagesService } from '@/services/funnel-stages.service'
import { SOURCE_META } from './constants'
import { resolveLeadStage, type ApiFunnelStage } from './api-mapper'
import { useMoveLeadStage } from './use-move-lead-stage'
import { StagePopover } from './components/stage-popover'

function formatLastContact(lead: Lead) {
  const days = daysSince(lead.lastContactAt ?? lead.createdAt)
  if (days === 0) return 'Hoje'
  return `Há ${days} dia${days > 1 ? 's' : ''}`
}

export function LeadsListView({ leads }: { leads: Lead[] }) {
  const { moveLead } = useMoveLeadStage()
  const { data: stages } = useQuery<ApiFunnelStage[]>({
    queryKey: ['funnel-stages'],
    queryFn: funnelStagesService.findAll,
  })

  return (
    <div className="overflow-x-auto rounded-[16px] border-[0.5px] border-neutral-200 bg-white">
      <table className="w-full min-w-[640px] text-left text-sm">
        <thead>
          <tr className="border-b-[0.5px] border-neutral-200 text-xs font-medium text-neutral-400">
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
            const source = SOURCE_META[lead.source]
            const currentStage = resolveLeadStage(lead, stages ?? [])
            return (
              <tr
                key={lead.id}
                className={`border-b-[0.5px] border-neutral-200 last:border-0 ${
                  index % 2 === 1 ? 'bg-neutral-100/50' : 'bg-white'
                }`}
              >
                <td className="px-4 py-3 font-medium text-neutral-900">
                  <Link href={`/leads/${lead.id}`} className="hover:text-brand hover:underline">
                    {lead.name}
                  </Link>
                </td>
                <td className="px-4 py-3">
                  <StagePopover
                    stages={stages ?? []}
                    currentStage={currentStage}
                    onSelect={(stage) => moveLead(lead.id, stage)}
                  />
                </td>
                <td className="hidden px-4 py-3 text-neutral-600 md:table-cell">{source.label}</td>
                <td className="hidden px-4 py-3 text-neutral-600 md:table-cell">
                  {formatCurrency(lead.interestValue ?? 0)}
                </td>
                <td className="hidden px-4 py-3 text-neutral-600 md:table-cell">
                  {lead.ownerName}
                </td>
                <td className="hidden px-4 py-3 text-neutral-600 md:table-cell">
                  {formatLastContact(lead)}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1">
                    <Link
                      href={`/leads/${lead.id}`}
                      aria-label="Ver lead"
                      className="rounded-[8px] p-1.5 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-900"
                    >
                      <Eye className="h-4 w-4" />
                    </Link>
                    <button
                      type="button"
                      aria-label="Editar lead"
                      className="rounded-[8px] p-1.5 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-900"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      aria-label="Nova tarefa"
                      className="rounded-[8px] p-1.5 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-900"
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
