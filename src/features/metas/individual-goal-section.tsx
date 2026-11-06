import { CalendarCheck, ArrowRight, Pencil, Target } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import { EmptyState } from '@/components/ui/empty-state'
import { Skeleton } from '@/components/ui/skeleton'
import { formatGoalValue, formatPercent } from './calculations'
import { FUNNEL_STAGES } from './constants'
import { FunnelStageCard } from './funnel-stage-card'
import { PaceBadge } from './pace-badge'
import { ProgressBar } from './progress-bar'
import type { ApiGoal, ApiGoalSummary } from './api'

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
  summary,
  canEdit,
  title = 'Minha meta do período',
  onRegisterToday,
  onCreateGoal,
  onEdit,
}: {
  goal: ApiGoal | undefined
  summary: ApiGoalSummary | undefined
  canEdit?: boolean
  title?: string
  onRegisterToday?: () => void
  onCreateGoal: () => void
  onEdit?: () => void
}) {
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

  if (!summary) {
    return <Skeleton className="h-64 rounded-[16px]" />
  }

  const { vgv, units, period, funnel, progress, pace } = summary
  const avgTicket = Number(goal.avgTicket ?? 0)
  const commission = vgv.target * (Number(goal.commissionPct ?? 0) / 100)

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

      {funnel ? (
        <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <Stat label="VGV desejado" value={formatCurrency(vgv.target)} />
          <Stat label="Ticket médio" value={formatCurrency(avgTicket)} />
          <Stat label="Comissão estimada" value={formatCurrency(commission)} />
          <Stat label="Unidades necessárias" value={String(units.target)} />
        </div>
      ) : (
        <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <Stat label="Meta" value={formatGoalValue(goal.type, progress.target)} />
          <Stat label="Realizado" value={formatGoalValue(goal.type, progress.current)} />
          <Stat label="Unidades vendidas" value={String(units.current)} />
          <Stat label="Dias restantes" value={String(period.daysLeft)} />
        </div>
      )}

      <div className="mt-4">
        <div className="flex items-center justify-between text-xs font-medium text-neutral-600">
          <span>
            {goal.type === 'vgv'
              ? `${formatCurrency(progress.current)} em vendas`
              : `${formatGoalValue(goal.type, progress.current)} de ${formatGoalValue(goal.type, progress.target)}`}
          </span>
          <span className="flex items-center gap-1.5">
            <PaceBadge pace={pace} />
            {formatPercent(progress.percent)}
          </span>
        </div>
        <div className="mt-1.5">
          <ProgressBar value={progress.percent} />
        </div>
      </div>

      {funnel && (
        <div className="mt-6 flex items-center overflow-x-auto pb-2">
          {FUNNEL_STAGES.map((stage, index) => (
            <div key={stage.key} className="flex shrink-0 items-center gap-2">
              <FunnelStageCard
                label={stage.label}
                meta={funnel.target[stage.apiKey]}
                realizado={funnel.realized[stage.apiKey]}
                metaDoDia={funnel.dailyTarget[stage.apiKey]}
              />
              {index < FUNNEL_STAGES.length - 1 && (
                <ArrowRight className="h-4 w-4 shrink-0 text-neutral-300" />
              )}
            </div>
          ))}
        </div>
      )}

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
