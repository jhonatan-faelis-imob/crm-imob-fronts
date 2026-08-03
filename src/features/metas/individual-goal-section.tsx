import { CalendarCheck, ArrowRight, Pencil, Target } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import { EmptyState } from '@/components/ui/empty-state'
import { Skeleton } from '@/components/ui/skeleton'
import { FUNNEL_STAGES, type FunnelStageKey } from './constants'
import { FunnelStageCard } from './funnel-stage-card'
import type { ApiGoal } from './api'
import { goalFunnelTargets } from './api'

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[13px] text-neutral-400">{label}</p>
      <p className="mt-0.5 text-base font-semibold text-neutral-900">{value}</p>
    </div>
  )
}

export function IndividualGoalSection({
  goal,
  realized,
  isLoading,
  canEdit,
  title = 'Minha meta do período',
  onRegisterToday,
  onCreateGoal,
  onEdit,
}: {
  goal: ApiGoal | undefined
  realized: Record<FunnelStageKey, number>
  isLoading: boolean
  canEdit?: boolean
  title?: string
  onRegisterToday?: () => void
  onCreateGoal: () => void
  onEdit?: () => void
}) {
  if (isLoading) {
    return <Skeleton className="h-64 rounded-[16px]" />
  }

  if (!goal) {
    return (
      <EmptyState
        icon={<Target className="h-6 w-6" />}
        title="Você ainda não tem uma meta individual"
        description="Crie sua meta do período para acompanhar seu funil de vendas dia a dia."
        action={{ label: 'Criar primeira meta', onClick: onCreateGoal }}
      />
    )
  }

  const targetVgv = Number(goal.targetVgv ?? 0)
  const avgTicket = Number(goal.avgTicket ?? 0)
  const commissionPct = Number(goal.commissionPct ?? 0)
  const units = goal.goalUnits ?? (avgTicket > 0 ? targetVgv / avgTicket : 0)
  const commission = targetVgv * (commissionPct / 100)
  const targets = goalFunnelTargets(goal)

  return (
    <div className="rounded-[16px] border-[0.5px] border-neutral-200 bg-white p-5 lg:p-6">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-[20px] font-semibold text-neutral-900">{title}</h2>
        {canEdit && (
          <button
            type="button"
            onClick={onEdit}
            aria-label="Editar meta"
            className="shrink-0 rounded-[8px] p-1.5 text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-neutral-900"
          >
            <Pencil className="h-4 w-4" />
          </button>
        )}
      </div>

      <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Stat label="VGV desejado" value={formatCurrency(targetVgv)} />
        <Stat label="Ticket médio" value={formatCurrency(avgTicket)} />
        <Stat label="Comissão estimada" value={formatCurrency(commission)} />
        <Stat label="Unidades necessárias" value={String(Math.ceil(units))} />
      </div>

      <div className="mt-6 flex items-center overflow-x-auto pb-2">
        {FUNNEL_STAGES.map((stage, index) => (
          <div key={stage.key} className="flex shrink-0 items-center gap-2">
            <FunnelStageCard
              label={stage.label}
              meta={targets[stage.key]}
              realizado={realized[stage.key]}
            />
            {index < FUNNEL_STAGES.length - 1 && (
              <ArrowRight className="h-4 w-4 shrink-0 text-neutral-300" />
            )}
          </div>
        ))}
      </div>

      {onRegisterToday && (
        <button
          type="button"
          onClick={onRegisterToday}
          className="mt-6 inline-flex items-center justify-center gap-2 rounded-[8px] bg-brand px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-brand-dark"
        >
          <CalendarCheck className="h-4 w-4" />
          Registrar hoje
        </button>
      )}
    </div>
  )
}
