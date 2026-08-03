import { Check } from 'lucide-react'
import type { ApiFunnelStage } from '../api-mapper'

export function StageOptionsList({
  stages,
  currentStageId,
  onSelect,
}: {
  stages: ApiFunnelStage[]
  currentStageId: string | undefined
  onSelect: (stage: ApiFunnelStage) => void
}) {
  return (
    <div className="space-y-1">
      {stages.map((stage) => {
        const isCurrent = stage.id === currentStageId
        return (
          <button
            key={stage.id}
            type="button"
            onClick={() => onSelect(stage)}
            className="flex w-full items-center gap-2.5 rounded-[8px] px-3 py-2 text-left text-sm transition-colors hover:bg-neutral-100"
          >
            <span
              className="h-2.5 w-2.5 shrink-0 rounded-full"
              style={{ backgroundColor: stage.color }}
            />
            <span className="flex-1 truncate font-medium text-neutral-900">{stage.name}</span>
            {isCurrent && <Check className="h-4 w-4 shrink-0 text-brand" />}
          </button>
        )
      })}
      {stages.length === 0 && (
        <p className="px-3 py-2 text-sm text-neutral-400">Nenhuma etapa cadastrada.</p>
      )}
    </div>
  )
}
