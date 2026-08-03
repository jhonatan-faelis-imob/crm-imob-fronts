'use client'

import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { cn } from '@/lib/utils'
import { stageBadgeStyle, type ApiFunnelStage } from '../api-mapper'
import { StageOptionsList } from './stage-options-list'

export function StagePopover({
  stages,
  currentStage,
  onSelect,
  className,
}: {
  stages: ApiFunnelStage[]
  currentStage: ApiFunnelStage | undefined
  onSelect: (stage: ApiFunnelStage) => void
  className?: string
}) {
  const [open, setOpen] = useState(false)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <button
            type="button"
            style={currentStage ? stageBadgeStyle(currentStage) : undefined}
            className={cn(
              'inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium transition-opacity hover:opacity-80',
              !currentStage && 'bg-neutral-100 text-neutral-400',
              className,
            )}
          />
        }
      >
        {currentStage?.name ?? 'Sem etapa'}
        <ChevronDown className="h-3 w-3" />
      </PopoverTrigger>
      <PopoverContent align="start">
        <p className="mb-2 px-1 text-xs font-medium text-neutral-400">Mover para</p>
        <StageOptionsList
          stages={stages}
          currentStageId={currentStage?.id}
          onSelect={(stage) => {
            onSelect(stage)
            setOpen(false)
          }}
        />
      </PopoverContent>
    </Popover>
  )
}
