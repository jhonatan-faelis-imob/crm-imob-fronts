import { Pencil } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import { formatPercent, getGoalStatusBorderClass } from './calculations'
import { GOAL_SCOPE_BADGE, GOAL_SCOPE_META } from './constants'
import { ProgressBar } from './progress-bar'
import type { GoalSummary } from './types'

export function GoalSummaryCard({
  goal,
  canEdit,
  onEdit,
}: {
  goal: GoalSummary
  canEdit?: boolean
  onEdit?: () => void
}) {
  const pct = goal.target > 0 ? (goal.realized / goal.target) * 100 : 0
  const borderClass = getGoalStatusBorderClass(pct)
  const scopeBadge = GOAL_SCOPE_BADGE[goal.scope]

  return (
    <div
      className={`rounded-[16px] border-[0.5px] border-l-[4px] border-neutral-200 bg-white p-5 ${borderClass}`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-neutral-600">{goal.label}</p>
          <span
            className="mt-1.5 inline-flex rounded-full px-2 py-0.5 text-[11px] font-medium"
            style={{ backgroundColor: scopeBadge.bg, color: scopeBadge.text }}
          >
            {GOAL_SCOPE_META[goal.scope]}
          </span>
        </div>
        {canEdit && (
          <button
            type="button"
            onClick={onEdit}
            aria-label="Editar meta"
            className="shrink-0 rounded-[8px] p-1.5 text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-neutral-900"
          >
            <Pencil className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
      <p className="mt-2 text-[28px] font-semibold text-neutral-900">
        {formatCurrency(goal.realized)}
      </p>
      <p className="text-xs text-neutral-400">de {formatCurrency(goal.target)}</p>
      <div className="mt-3 flex items-center justify-between text-xs font-medium text-neutral-600">
        <span>Progresso</span>
        <span>{formatPercent(pct)}</span>
      </div>
      <div className="mt-1.5">
        <ProgressBar value={pct} />
      </div>
    </div>
  )
}
