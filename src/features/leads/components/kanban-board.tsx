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
import { Info } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Lead } from '@/types'
import { funnelStagesService } from '@/services/funnel-stages.service'
import { cadencesService } from '@/services/cadences.service'
import { Skeleton } from '@/components/ui/skeleton'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { formatOffset, readableStepTitle } from '@/features/cadencias/constants'
import type { CadenceStep } from '@/types'
import { resolveLeadStage, type ApiFunnelStage } from '../api-mapper'
import { useMoveLeadToStage } from '../use-move-lead-to-stage'
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

const CADENCE_STALE_TIME = 5 * 60 * 1000

function CadenceHint({ steps }: { steps: CadenceStep[] }) {
  if (steps.length === 0) return null
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <button
            type="button"
            aria-label="Tarefas automáticas desta etapa"
            className="flex h-6 w-6 items-center justify-center rounded-full text-neutral-400 transition-colors hover:text-neutral-900"
          />
        }
      >
        <Info className="h-3.5 w-3.5" />
      </TooltipTrigger>
      <TooltipContent side="bottom" align="start" className="max-w-64">
        <p className="mb-1 font-medium">Tarefas automáticas</p>
        <ul className="space-y-0.5">
          {steps.map((step) => (
            <li key={step.id}>
              {formatOffset(step.offsetDays)} · {readableStepTitle(step.title)}
            </li>
          ))}
        </ul>
      </TooltipContent>
    </Tooltip>
  )
}

function DroppableColumn({
  stage,
  leads,
  cadenceSteps,
}: {
  stage: ApiFunnelStage
  leads: Lead[]
  cadenceSteps: CadenceStep[]
}) {
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
          <CadenceHint steps={cadenceSteps} />
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
  const { moveLead } = useMoveLeadToStage()

  const { data: stages } = useQuery<ApiFunnelStage[]>({
    queryKey: ['funnel-stages'],
    queryFn: funnelStagesService.findAll,
  })

  // Mesma chave da tela /cadencias; os passos mudam pouco
  const { data: cadences } = useQuery({
    queryKey: ['cadences'],
    queryFn: cadencesService.findAll,
    staleTime: CADENCE_STALE_TIME,
  })

  function activeStepsFor(stageId: string) {
    return cadences?.find((stage) => stage.id === stageId)?.cadenceSteps.filter((step) => step.active) ?? []
  }

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

    moveLead(lead, targetStage)
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
          <DroppableColumn
            key={stage.id}
            stage={stage}
            leads={leadsForStage(stage.id)}
            cadenceSteps={activeStepsFor(stage.id)}
          />
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
