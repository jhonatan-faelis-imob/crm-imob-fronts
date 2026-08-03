'use client'

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import type { ApiFunnelStage } from '../api-mapper'
import { StageOptionsList } from './stage-options-list'

export function MoveStageDialog({
  open,
  onOpenChange,
  stages,
  currentStageId,
  onSelect,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  stages: ApiFunnelStage[]
  currentStageId: string | undefined
  onSelect: (stage: ApiFunnelStage) => void
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[calc(100%-2rem)] max-w-sm rounded-2xl border-[0.5px] border-neutral-200 bg-white p-0 ring-0">
        <DialogHeader className="gap-1 border-b-[0.5px] border-neutral-200 p-4 pr-12 sm:p-6 sm:pr-14">
          <DialogTitle>Mover lead</DialogTitle>
          <DialogDescription>Selecione a nova etapa do funil.</DialogDescription>
        </DialogHeader>
        <div className="p-4 sm:p-6 pt-0 sm:pt-0">
          <StageOptionsList
            stages={stages}
            currentStageId={currentStageId}
            onSelect={(stage) => {
              onSelect(stage)
              onOpenChange(false)
            }}
          />
        </div>
      </DialogContent>
    </Dialog>
  )
}
