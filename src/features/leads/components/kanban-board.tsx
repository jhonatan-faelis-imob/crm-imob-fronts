'use client'

import { useState } from 'react'
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  closestCenter,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core'
import { useQuery } from '@tanstack/react-query'
import { cn } from '@/lib/utils'
import type { Lead } from '@/types'
import { funnelStagesService } from '@/services/funnel-stages.service'
import { Skeleton } from '@/components/ui/skeleton'
import { resolveLeadStage, type ApiFunnelStage } from '../api-mapper'
import { useMoveLeadStage } from '../use-move-lead-stage'
import { LeadCard } from '../lead-card'

function DraggableLeadCard({ lead }: { lead: Lead }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: lead.id })

  return (
    <div ref={setNodeRef} {...attributes} {...listeners} className={cn('touch-none', isDragging && 'opacity-50')}>
      <LeadCard lead={lead} />
    </div>
  )
}

export function formatVgv(value: number): string {
  if (value >= 1_000_000) return `R$ ${(value / 1_000_000).toFixed(1)}M`
  if (value >= 1_000) return `R$ ${(value / 1_000).toFixed(0)}K`
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function sumInterestValue(leads: Lead[]): number {
  return leads.reduce((sum, lead) => sum + (lead.interestValue ?? 0), 0)
}

function DroppableColumn({ stage, leads }: { stage: ApiFunnelStage; leads: Lead[] }) {
  const { setNodeRef, isOver } = useDroppable({ id: stage.id })
  const columnVgv = sumInterestValue(leads)

  return (
    <div className="flex w-[280px] shrink-0 flex-col">
      <div className="h-1 rounded-full" style={{ backgroundColor: stage.color }} />
      <div className="mt-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold text-neutral-900">{stage.name}</h3>
          <span
            className="rounded-full px-2 py-0.5 text-xs font-medium"
            style={{ backgroundColor: `${stage.color}26`, color: stage.color }}
          >
            {leads.length}
          </span>
        </div>
        {columnVgv > 0 && (
          <span className="rounded-full bg-brand-bg px-2 py-0.5 text-xs font-semibold text-brand">
            {formatVgv(columnVgv)}
          </span>
        )}
      </div>
      <div
        ref={setNodeRef}
        className={cn(
          'mt-3 min-h-[120px] max-h-[70vh] space-y-3 overflow-y-auto rounded-[16px] border-[1.5px] border-transparent p-1 pb-2 transition-colors',
          isOver && 'border-brand bg-brand-bg',
        )}
      >
        {leads.map((lead) => (
          <DraggableLeadCard key={lead.id} lead={lead} />
        ))}
        {leads.length === 0 && (
          <p className="rounded-[16px] border-[0.5px] border-dashed border-neutral-200 p-4 text-center text-xs text-neutral-400">
            Nenhum lead nesta etapa
          </p>
        )}
      </div>
    </div>
  )
}

export function KanbanBoard({ leads }: { leads: Lead[] }) {
  const [activeId, setActiveId] = useState<string | null>(null)
  const { moveLead } = useMoveLeadStage()

  const { data: stages } = useQuery<ApiFunnelStage[]>({
    queryKey: ['funnel-stages'],
    queryFn: funnelStagesService.findAll,
  })

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }))

  const orderedStages = (stages ?? []).slice().sort((a, b) => a.orderIndex - b.orderIndex)

  function leadsForStage(stageId: string) {
    return leads.filter((lead) => resolveLeadStage(lead, orderedStages)?.id === stageId)
  }

  const activeLead = activeId ? leads.find((lead) => lead.id === activeId) : undefined

  function handleDragStart(event: DragStartEvent) {
    setActiveId(String(event.active.id))
  }

  function handleDragEnd(event: DragEndEvent) {
    setActiveId(null)
    const { active, over } = event
    if (!over) return

    const leadId = String(active.id)
    const targetStage = orderedStages.find((stage) => stage.id === String(over.id))
    const lead = leads.find((item) => item.id === leadId)
    if (!targetStage || !lead) return

    const currentStage = resolveLeadStage(lead, orderedStages)
    if (currentStage?.id === targetStage.id) return

    moveLead(leadId, targetStage)
  }

  if (!stages) {
    return (
      <div className="flex gap-4 overflow-x-auto pb-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-64 w-[280px] shrink-0 rounded-[16px]" />
        ))}
      </div>
    )
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={() => setActiveId(null)}
    >
      <div className="flex gap-4 overflow-x-auto pb-2">
        {orderedStages.map((stage) => (
          <DroppableColumn key={stage.id} stage={stage} leads={leadsForStage(stage.id)} />
        ))}
      </div>
      <DragOverlay>
        {activeLead ? (
          <div className="w-[280px] rotate-2 opacity-90">
            <LeadCard lead={activeLead} />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  )
}
