import type { GoalScope, GoalType } from '@/types'
import {
  DEFAULT_CONVERSION_RATES,
  GOAL_SCOPE_META,
  GOAL_TYPE_META,
  type ConversionRates,
  type FunnelApiKey,
  type Period,
} from './constants'

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
  targetValue: string | number | null
  conversionRates: Partial<ConversionRates> | null
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
  user?: { id: string; name: string; avatarUrl: string | null; teamId?: string | null } | null
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

type FunnelCounts = Record<FunnelApiKey, number>

export type ApiGoalEntry = FunnelCounts & { date: string }

export interface ApiGoalSummary {
  goal: ApiGoal
  period: { start: string; end: string; daysTotal: number; daysElapsed: number; daysLeft: number }
  vgv: { target: number; current: number; percent: number }
  units: { target: number; current: number; percent: number }
  progress: { current: number; target: number; percent: number }
  pace: { expectedPercent: number; actualPercent: number; status: 'adiantado' | 'no_ritmo' | 'atrasado' }
  // Só em meta individual de VGV; as demais devolvem apenas os blocos acima
  funnel?: {
    realized: FunnelCounts
    target: FunnelCounts
    remaining: FunnelCounts
    dailyTarget: FunnelCounts
  }
  today?: ApiGoalDailyEntry | null
}

export type ApiAutoFill = FunnelCounts & { date: string }

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

export function periodTabForGoal(goal: ApiGoal): Period | undefined {
  const tabs: Period[] = ['mes', 'trimestre', 'ano']
  return tabs.find((tab) => matchesPeriodTab(goal, tab))
}

export function isCurrentGoal(goal: Pick<ApiGoal, 'periodStart' | 'periodEnd'>, today: string) {
  return goal.periodStart.slice(0, 10) <= today && today <= goal.periodEnd.slice(0, 10)
}

// O registro diário vale até hoje, mas nunca depois do fim da meta
export function lastRegisterableDay(goal: Pick<ApiGoal, 'periodEnd'>, today: string) {
  const periodEnd = goal.periodEnd.slice(0, 10)
  return today < periodEnd ? today : periodEnd
}

function goalPriority(goal: ApiGoal, userId: string | undefined) {
  const scope = goalScope(goal)
  if (scope === 'individual') return goal.userId === userId ? 0 : 1
  return scope === 'equipe' ? 2 : 3
}

export function pickDefaultGoal(goals: ApiGoal[], userId: string | undefined, today: string) {
  return goals
    .filter((goal) => goal.active && isCurrentGoal(goal, today))
    .sort((a, b) => goalPriority(a, userId) - goalPriority(b, userId))
    .at(0)
}

// Espelha as regras de GoalsService.resolveOwner, que continua sendo quem decide
export function allowedGoalScopes(role: string | undefined): GoalScope[] {
  if (role === 'diretor' || role === 'gerente') return ['organizacao', 'equipe', 'individual']
  if (role === 'coordenador') return ['equipe', 'individual']
  return ['individual']
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

// Espelha canManageGoal em goals.service.ts: editar e excluir seguem a mesma regra
export function canEditGoal(
  goal: ApiGoal,
  user: { id: string; role: string; teamId?: string | null } | null,
): boolean {
  if (!user) return false
  if (user.role === 'diretor' || user.role === 'gerente') return true
  if (goal.userId === user.id) return true
  if (user.role !== 'coordenador' || !user.teamId) return false
  return goal.teamId === user.teamId || goal.user?.teamId === user.teamId
}

interface NewGoalFormShape {
  scope: GoalScope
  teamId?: string
  type: GoalType
  startDate: string
  endDate: string
  targetValue?: number
  individualVgv?: number
  individualTicket?: number
  individualCommissionPct?: number
  rates: ConversionRates
}

export function hasFunnel(data: { scope?: GoalScope; type?: GoalType }) {
  return data.scope === 'individual' && (!data.type || data.type === 'vgv')
}

// Pré-popula o formulário de "Nova meta" (reutilizado para edição) a partir de uma meta existente.
export function goalToFormValues(goal: ApiGoal): NewGoalFormShape {
  const scope = goalScope(goal)
  const targetVgv = Number(goal.targetVgv ?? 0)
  const withFunnel = hasFunnel({ scope, type: goal.type as GoalType })
  return {
    scope,
    teamId: goal.teamId ?? undefined,
    type: goal.type as GoalType,
    startDate: goal.periodStart.slice(0, 10),
    endDate: goal.periodEnd.slice(0, 10),
    targetValue: goal.type === 'vgv' ? targetVgv : Number(goal.targetValue ?? goal.targetVgv ?? 0),
    individualVgv: withFunnel ? targetVgv : undefined,
    individualTicket: withFunnel ? Number(goal.avgTicket ?? 0) : undefined,
    individualCommissionPct: withFunnel ? Number(goal.commissionPct ?? 0) : undefined,
    rates: { ...DEFAULT_CONVERSION_RATES, ...goal.conversionRates },
  }
}

// A ficha de nova meta é a mesma para os 3 escopos, mas o backend só calcula o funil
// automaticamente quando recebe targetVgv + avgTicket (fluxo pensado para metas
// individuais) — por isso preferimos os campos individuais quando o escopo é 'individual'.
// userId não é enviado: o backend usa o dono atual da meta ou, ao criar, o usuário logado.
export function mapFormToCreateGoalDto(data: NewGoalFormShape): Record<string, unknown> {
  const withFunnel = hasFunnel(data)
  return {
    scope: data.scope,
    title: `Meta de ${GOAL_TYPE_META[data.type]} — ${GOAL_SCOPE_META[data.scope]}`,
    type: data.type,
    period: inferPeriod(data.startDate, data.endDate),
    periodStart: data.startDate,
    periodEnd: data.endDate,
    targetVgv: withFunnel ? data.individualVgv : data.type === 'vgv' ? data.targetValue : null,
    targetValue: data.type === 'vgv' ? null : data.targetValue,
    avgTicket: withFunnel ? data.individualTicket : null,
    commissionPct: withFunnel ? data.individualCommissionPct : null,
    conversionRates: withFunnel ? data.rates : undefined,
    teamId: data.scope === 'equipe' ? data.teamId || undefined : undefined,
  }
}
