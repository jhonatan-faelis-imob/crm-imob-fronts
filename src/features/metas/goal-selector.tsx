import { goalScope, type ApiGoal } from './api'
import { GOAL_SCOPE_BADGE, GOAL_SCOPE_META } from './constants'

function formatPeriodRange(goal: ApiGoal) {
  const options: Intl.DateTimeFormatOptions = { day: '2-digit', month: 'short' }
  const start = new Date(goal.periodStart).toLocaleDateString('pt-BR', options)
  const end = new Date(goal.periodEnd).toLocaleDateString('pt-BR', options)
  return `${start} – ${end}`
}

export function GoalSelector({
  goals,
  selectedId,
  onSelect,
}: {
  goals: ApiGoal[]
  selectedId: string | undefined
  onSelect: (id: string) => void
}) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-1">
      {goals.map((goal) => {
        const scope = goalScope(goal)
        const badge = GOAL_SCOPE_BADGE[scope]
        const isSelected = goal.id === selectedId

        return (
          <button
            key={goal.id}
            type="button"
            onClick={() => onSelect(goal.id)}
            className={`shrink-0 rounded-[12px] border-[1.5px] px-4 py-2.5 text-left transition-colors ${
              isSelected ? 'border-brand bg-brand-bg' : 'border-neutral-200 bg-white hover:border-neutral-300'
            }`}
          >
            <p className={`max-w-[180px] truncate text-sm font-medium ${isSelected ? 'text-brand' : 'text-neutral-900'}`}>
              {goal.title}
            </p>
            <div className="mt-1 flex items-center gap-1.5">
              <span
                className="rounded-full px-1.5 py-0.5 text-[10px] font-medium"
                style={{ backgroundColor: badge.bg, color: badge.text }}
              >
                {GOAL_SCOPE_META[scope]}
              </span>
              <span className="text-[11px] text-neutral-400">{formatPeriodRange(goal)}</span>
            </div>
          </button>
        )
      })}
    </div>
  )
}
