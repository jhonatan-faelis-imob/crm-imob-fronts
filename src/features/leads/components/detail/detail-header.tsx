'use client'

import Link from 'next/link'
import { ArrowLeft, MoreVertical, Pencil } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import type { Lead } from '@/types'
import { funnelStagesService } from '@/services/funnel-stages.service'
import { resolveLeadStage, type ApiFunnelStage } from '../../api-mapper'
import { StagePopover } from '../stage-popover'
import { LEAD_URGENCY_META } from '../../lead-form/options'

export function DetailHeader({
  lead,
  onEdit,
  onTransfer,
  onMarkAsLost,
  onArchive,
  onSelectStage,
}: {
  lead: Lead
  onEdit: () => void
  onTransfer: () => void
  onMarkAsLost: () => void
  onArchive: () => void
  onSelectStage: (stage: ApiFunnelStage) => void
}) {
  const { data: stages } = useQuery<ApiFunnelStage[]>({
    queryKey: ['funnel-stages'],
    queryFn: funnelStagesService.findAll,
  })
  const currentStage = resolveLeadStage(lead, stages ?? [])
  const urgency = lead.urgency ? LEAD_URGENCY_META[lead.urgency] : null

  return (
    <div className="space-y-3">
      <Link
        href="/leads"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-neutral-400 hover:text-neutral-900"
      >
        <ArrowLeft className="h-4 w-4" />
        Leads
      </Link>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-2.5">
          <h1 className="text-[28px] font-semibold text-neutral-900">{lead.name}</h1>
          <StagePopover stages={stages ?? []} currentStage={currentStage} onSelect={onSelectStage} />
          {urgency && (
            <span
              className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium"
              style={{ backgroundColor: urgency.bg, color: urgency.text }}
            >
              {urgency.emoji} {urgency.label}
            </span>
          )}
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={onEdit}
            className="inline-flex items-center gap-2 rounded-[8px] border-[1.5px] border-neutral-900 px-4 py-2.5 text-sm font-medium text-neutral-900 transition-colors hover:bg-neutral-100"
          >
            <Pencil className="h-4 w-4" />
            Editar lead
          </button>

          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <button
                  type="button"
                  aria-label="Mais opções"
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[8px] border-[0.5px] border-neutral-200 text-neutral-600 hover:bg-neutral-100"
                />
              }
            >
              <MoreVertical className="h-4 w-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={onTransfer}>Transferir corretor</DropdownMenuItem>
              <DropdownMenuItem onClick={onMarkAsLost}>Marcar como perdido</DropdownMenuItem>
              <DropdownMenuItem onClick={onArchive} variant="destructive">
                Arquivar
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  )
}
