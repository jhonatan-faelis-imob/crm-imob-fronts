import { formatCurrency } from '@/lib/utils'
import type { ConversionRates, FunnelStageKey } from './constants'

export interface ComputedFunnel {
  units: number
  commission: number
  stages: Record<FunnelStageKey, number>
}

export function computeFunnelFromVgv(
  vgv: number,
  avgTicket: number,
  commissionPct: number,
  rates: ConversionRates
): ComputedFunnel | null {
  if (!vgv || !avgTicket || vgv <= 0 || avgTicket <= 0) return null

  // Mesmo arredondamento do backend: não existe meia unidade vendida
  const fechamentos = Math.ceil(vgv / avgTicket)
  const agendamentos = Math.ceil(fechamentos * rates.appointmentsPerClosing)
  const simulacoes = Math.ceil(agendamentos * rates.simulationsPerAppointment)
  const qualificacoes = Math.ceil(simulacoes * rates.qualificationsPerSimulation)
  const prospeccoes = Math.ceil(qualificacoes * rates.prospectsPerQualification)
  const ligacoes = Math.ceil(prospeccoes * rates.callsPerProspect)

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

export function formatGoalValue(type: string, value: number) {
  return type === 'vgv' ? formatCurrency(value) : value.toLocaleString('pt-BR')
}

export function formatPercent(value: number) {
  return `${value.toLocaleString('pt-BR', { maximumFractionDigits: 1 })}%`
}

export function getGoalStatusBorderClass(pct: number) {
  if (pct >= 80) return 'border-l-success'
  if (pct >= 50) return 'border-l-warning'
  return 'border-l-danger'
}
