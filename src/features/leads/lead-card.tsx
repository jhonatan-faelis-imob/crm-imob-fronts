'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ListTodo, MoreVertical } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { daysSince, formatCurrency, getInitials } from '@/lib/utils'
import type { Lead } from '@/types'
import { funnelStagesService } from '@/services/funnel-stages.service'
import { SOURCE_META } from './constants'
import { LEAD_URGENCY_META } from './lead-form/options'
import { resolveLeadStage, type ApiFunnelStage } from './api-mapper'
import { useMoveLeadStage } from './use-move-lead-stage'
import { MoveStageDialog } from './components/move-stage-dialog'

const MAX_VISIBLE_TAGS = 2

export function LeadCard({ lead }: { lead: Lead }) {
  const router = useRouter()
  const [isMoveDialogOpen, setIsMoveDialogOpen] = useState(false)
  const { moveLead } = useMoveLeadStage()

  const { data: stages } = useQuery<ApiFunnelStage[]>({
    queryKey: ['funnel-stages'],
    queryFn: funnelStagesService.findAll,
  })

  const source = SOURCE_META[lead.source]
  const SourceIcon = source.icon
  const days = daysSince(lead.lastContactAt ?? lead.createdAt)
  const isStale = days > 2
  const urgency = lead.urgency ? LEAD_URGENCY_META[lead.urgency] : null
  const tags = lead.tags ?? []
  const visibleTags = tags.slice(0, MAX_VISIBLE_TAGS)
  const hiddenTagsCount = tags.length - visibleTags.length
  const currentStage = resolveLeadStage(lead, stages ?? [])

  return (
    <>
    <div
      role="link"
      tabIndex={0}
      onClick={() => router.push(`/leads/${lead.id}`)}
      onKeyDown={(event) => {
        if (event.key === 'Enter') router.push(`/leads/${lead.id}`)
      }}
      className="group relative block cursor-pointer rounded-[16px] border-[0.5px] border-neutral-200 bg-white p-4 transition-colors hover:border-brand"
    >
      <div className="absolute right-3 top-3 flex items-center gap-1">
        {lead.hasPendingTask && (
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-brand-bg text-brand">
            <ListTodo className="h-3.5 w-3.5" />
          </span>
        )}
        <DropdownMenu>
          <DropdownMenuTrigger
            onPointerDown={(event) => event.stopPropagation()}
            onClick={(event) => event.stopPropagation()}
            render={
              <button
                type="button"
                aria-label="Mais opções"
                className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-neutral-400 hover:bg-neutral-100 hover:text-neutral-900"
              />
            }
          >
            <MoreVertical className="h-3.5 w-3.5" />
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            onClick={(event) => event.stopPropagation()}
            onPointerDown={(event) => event.stopPropagation()}
          >
            <DropdownMenuItem onClick={() => setIsMoveDialogOpen(true)}>Mover para...</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <p className="pr-14 text-sm font-medium text-neutral-900">{lead.name}</p>

      <div className="mt-1.5 flex items-center gap-1.5 text-xs text-neutral-400">
        <SourceIcon className="h-3.5 w-3.5" />
        {source.label}
      </div>

      {urgency && (
        <span
          className="mt-2 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium"
          style={{ backgroundColor: urgency.bg, color: urgency.text }}
        >
          {urgency.emoji} {urgency.label}
        </span>
      )}

      <p className="mt-2 text-sm font-semibold text-neutral-900">
        {formatCurrency(lead.interestValue ?? 0)}
      </p>

      {tags.length > 0 && (
        <div className="mt-2 flex flex-wrap items-center gap-1">
          {visibleTags.map((tag) => (
            <span
              key={tag.id}
              className="rounded-full bg-neutral-100 px-2 py-0.5 text-[11px] font-medium text-neutral-600"
            >
              {tag.label}
            </span>
          ))}
          {hiddenTagsCount > 0 && (
            <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-[11px] font-medium text-neutral-400">
              +{hiddenTagsCount}
            </span>
          )}
        </div>
      )}

      <div className="mt-3 flex items-center gap-2">
        <Avatar size="sm">
          <AvatarFallback className="bg-brand-bg text-brand">
            {getInitials(lead.ownerName)}
          </AvatarFallback>
        </Avatar>
        <span className="truncate text-xs text-neutral-600">{lead.ownerName}</span>
      </div>

      <p className={`mt-2 text-xs ${isStale ? 'font-medium text-warning' : 'text-neutral-400'}`}>
        {days === 0 ? 'Contato hoje' : `Sem contato há ${days} dia${days > 1 ? 's' : ''}`}
      </p>
    </div>
    <MoveStageDialog
      open={isMoveDialogOpen}
      onOpenChange={setIsMoveDialogOpen}
      stages={stages ?? []}
      currentStageId={currentStage?.id}
      onSelect={(stage) => moveLead(lead.id, stage)}
    />
    </>
  )
}
