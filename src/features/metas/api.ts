import type { GoalScope, GoalType } from '@/types'
import { GOAL_SCOPE_META, GOAL_TYPE_META, type FunnelStageKey } from './constants'

export interface ApiGoal {
  id: string
  organizationId: string
  teamId: string | null
  userId: string | null
  title: string
  type: string
  period: string
  periodStart: string
  periodEnd: string
  targetVgv: string | number | null
  avgTicket: string | number | null
  commissionPct: string | number | null
  goalUnits: number | null
  goalCalls: number | null
  goalProspects: number | null
  goalQualifications: number | null
  goalSimulations: number | null
  goalAppointments: number | null
  goalClosings: number | null
  currentVgv: string | number
  currentUnits: number
  active: boolean
  createdAt: string
  updatedAt: string
  team?: { id: string; name: string } | null
  user?: { id: string; name: string; avatarUrl: string | null } | null
  _count?: { dailyEntries: number }
}

export interface ApiGoalDailyEntry {
  id: string
  goalId: string
  userId: string
  organizationId: string
  date: string
  calls: number
  prospects: number
  qualifications: number
  simulations: number
  appointments: number
  closings: number
  notes: string | null
  createdAt: string
}

// O backend não guarda um "escopo" — ele é derivado de teamId/userId, exatamente como
// documentado na tabela de metas do CLAUDE.md (organização = nenhum dos dois, equipe =
// teamId, individual = userId).
export function goalScope(goal: Pick<ApiGoal, 'teamId' | 'userId'>): GoalScope {
  if (goal.userId) return 'individual'
  if (goal.teamId) return 'equipe'
  return 'organizacao'
}

const PERIOD_TAB_TO_BACKEND: Record<string, string> = {
  mes: 'mensal',
  trimestre: 'trimestral',
  ano: 'anual',
}

export function matchesPeriodTab(goal: ApiGoal, tab: string): boolean {
  return goal.period === (PERIOD_TAB_TO_BACKEND[tab] ?? tab)
}

function daysBetween(start: string, end: string) {
  return Math.round((new Date(end).getTime() - new Date(start).getTime()) / 86400000)
}

export function inferPeriod(startDate: string, endDate: string): string {
  const days = daysBetween(startDate, endDate)
  if (days <= 31) return 'mensal'
  if (days <= 100) return 'trimestral'
  if (days <= 370) return 'anual'
  return 'custom'
}

export function goalFunnelTargets(goal: ApiGoal): Record<FunnelStageKey, number> {
  return {
    ligacoes: goal.goalCalls ?? 0,
    prospeccoes: goal.goalProspects ?? 0,
    qualificacoes: goal.goalQualifications ?? 0,
    simulacoes: goal.goalSimulations ?? 0,
    agendamentos: goal.goalAppointments ?? 0,
    fechamentos: goal.goalClosings ?? 0,
  }
}

export function sumEntriesByStage(entries: ApiGoalDailyEntry[]): Record<FunnelStageKey, number> {
  const totals: Record<FunnelStageKey, number> = {
    ligacoes: 0,
    prospeccoes: 0,
    qualificacoes: 0,
    simulacoes: 0,
    agendamentos: 0,
    fechamentos: 0,
  }
  for (const entry of entries) {
    totals.ligacoes += entry.calls
    totals.prospeccoes += entry.prospects
    totals.qualificacoes += entry.qualifications
    totals.simulacoes += entry.simulations
    totals.agendamentos += entry.appointments
    totals.fechamentos += entry.closings
  }
  return totals
}

export function canEditGoal(
  goal: ApiGoal,
  user: { id: string; role: string; teamId?: string | null } | null,
): boolean {
  if (!user) return false
  if (user.role === 'diretor' || user.role === 'gerente') return true
  if (user.role === 'coordenador' && goal.teamId === user.teamId) return true
  return goal.userId === user.id
}

interface NewGoalFormShape {
  scope: GoalScope
  type: GoalType
  startDate: string
  endDate: string
  targetValue: number
  individualVgv?: number
  individualTicket?: number
  individualCommissionPct?: number
}

// Pré-popula o formulário de "Nova meta" (reutilizado para edição) a partir de uma meta existente.
export function goalToFormValues(goal: ApiGoal): NewGoalFormShape {
  const scope = goalScope(goal)
  const targetVgv = Number(goal.targetVgv ?? 0)
  return {
    scope,
    type: goal.type as GoalType,
    startDate: goal.periodStart.slice(0, 10),
    endDate: goal.periodEnd.slice(0, 10),
    targetValue: targetVgv,
    individualVgv: scope === 'individual' ? targetVgv : undefined,
    individualTicket: scope === 'individual' ? Number(goal.avgTicket ?? 0) : undefined,
    individualCommissionPct: scope === 'individual' ? Number(goal.commissionPct ?? 0) : undefined,
  }
}

// A ficha de nova meta é a mesma para os 3 escopos, mas o backend só calcula o funil
// automaticamente quando recebe targetVgv + avgTicket (fluxo pensado para metas
// individuais) — por isso preferimos os campos individuais quando o escopo é 'individual'.
export function mapFormToCreateGoalDto(
  data: NewGoalFormShape,
  user: { id: string; teamId: string | null },
): Record<string, unknown> {
  return {
    title: `Meta de ${GOAL_TYPE_META[data.type]} — ${GOAL_SCOPE_META[data.scope]}`,
    type: data.type,
    period: inferPeriod(data.startDate, data.endDate),
    periodStart: data.startDate,
    periodEnd: data.endDate,
    targetVgv: data.scope === 'individual' ? data.individualVgv : data.targetValue,
    avgTicket: data.scope === 'individual' ? data.individualTicket : null,
    commissionPct: data.scope === 'individual' ? data.individualCommissionPct : null,
    userId: data.scope === 'individual' ? user.id : null,
    teamId: data.scope === 'equipe' ? (user.teamId ?? null) : null,
  }
}
