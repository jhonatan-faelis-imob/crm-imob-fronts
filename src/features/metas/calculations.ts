import type { FunnelStageKey } from './constants'

export interface ComputedFunnel {
  units: number
  commission: number
  stages: Record<FunnelStageKey, number>
}

export function computeFunnelFromVgv(
  vgv: number,
  avgTicket: number,
  commissionPct: number
): ComputedFunnel | null {
  if (!vgv || !avgTicket || vgv <= 0 || avgTicket <= 0) return null

  const fechamentos = vgv / avgTicket
  const agendamentos = fechamentos * 3
  const simulacoes = agendamentos * 2
  const qualificacoes = simulacoes * 2
  const prospeccoes = qualificacoes * 3
  const ligacoes = prospeccoes * 5

  return {
    units: fechamentos,
    commission: vgv * ((commissionPct || 0) / 100),
    stages: {
      ligacoes,
      prospeccoes,
      qualificacoes,
      simulacoes,
      agendamentos,
      fechamentos,
    },
  }
}

export function formatPercent(value: number) {
  return `${value.toLocaleString('pt-BR', { maximumFractionDigits: 1 })}%`
}

export function getGoalStatusBorderClass(pct: number) {
  if (pct >= 80) return 'border-l-success'
  if (pct >= 50) return 'border-l-warning'
  return 'border-l-danger'
}
