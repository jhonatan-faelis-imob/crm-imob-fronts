import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import type { ApiGoalSummary } from './api'
import { formatPercent } from './calculations'

const PACE_META: Record<ApiGoalSummary['pace']['status'], { label: string; bg: string; text: string }> = {
  adiantado: { label: 'Adiantado', bg: '#E8F5E9', text: '#008A05' },
  no_ritmo: { label: 'No ritmo', bg: '#FFF3E0', text: '#C45800' },
  atrasado: { label: 'Atrasado', bg: '#FFEBEE', text: '#D93B30' },
}

export function PaceBadge({ pace }: { pace: ApiGoalSummary['pace'] }) {
  const meta = PACE_META[pace.status]

  return (
    <Tooltip>
      <TooltipTrigger
        delay={0}
        render={
          <span
            tabIndex={0}
            className="inline-flex rounded-full px-2 py-0.5 text-[11px] font-medium"
            style={{ backgroundColor: meta.bg, color: meta.text }}
          />
        }
      >
        {meta.label}
      </TooltipTrigger>
      <TooltipContent>
        Esperado hoje: {formatPercent(pace.expectedPercent)} · Realizado: {formatPercent(pace.actualPercent)}
      </TooltipContent>
    </Tooltip>
  )
}
