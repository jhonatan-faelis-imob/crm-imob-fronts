import type { FunnelStage } from '@/types'

/** Coordenador ou superior (mesma regra do @Roles('coordenador') das rotas de etapas) */
const MANAGE_ROLES = new Set(['coordenador', 'gerente', 'diretor'])

export function canManageFunnel(user: { role: string } | null | undefined): boolean {
  return !!user && MANAGE_ROLES.has(user.role)
}

/** Cores dos selos de etapa já usadas no sistema (padrões do funil, cadências e marca) */
export const STAGE_PALETTE = [
  '#94a3b8', '#60a5fa', '#a78bfa', '#f59e0b', '#fb923c',
  '#f43f5e', '#22c55e', '#ef4444', '#FF385C', '#6366f1',
] as const

export const DEFAULT_STAGE_COLOR = '#6366f1'
export const MAX_STAGE_NAME = 40

const HEX = /^#[0-9a-fA-F]{6}$/

export function isHexColor(value: string): boolean {
  return HEX.test(value)
}

/** Etapa com leads e passos de cadência, como o GET /funnel-stages devolve */
export interface ApiStage extends FunnelStage {
  leadsCount: number
  cadenceStepsCount: number
}

export function plural(count: number, singular: string, pluralText: string): string {
  return `${count} ${count === 1 ? singular : pluralText}`
}

export function leadsText(count: number): string {
  return plural(count, 'lead', 'leads')
}

/** Mesma normalização do backend (sem acento, minúsculas) para reconhecer Ganho e Perdido */
function normalize(name: string): string {
  return name.normalize('NFD').replace(/[̀-ͯ]/g, '').trim().toLowerCase()
}

export function isTerminalStage(stage: Pick<FunnelStage, 'name'>): boolean {
  const name = normalize(stage.name)
  return name === 'ganho' || name === 'perdido'
}

export type Placement = 'antes' | 'depois'

/**
 * Posição para a etapa nova: antes de uma etapa (a posição dela) ou depois (a seguinte).
 * O backend empurra as etapas dessa posição em diante
 */
export function orderIndexFor(stage: Pick<FunnelStage, 'orderIndex'>, placement: Placement): number {
  return placement === 'antes' ? stage.orderIndex : stage.orderIndex + 1
}

/** Sugestão de posição: logo antes de Ganho (ou depois da última, sem Ganho) */
export function defaultPlacement(stages: FunnelStage[]): { stageId: string; placement: Placement } | null {
  if (stages.length === 0) return null
  const won = stages.find((stage) => normalize(stage.name) === 'ganho')
  if (won) return { stageId: won.id, placement: 'antes' }
  return { stageId: stages[stages.length - 1].id, placement: 'depois' }
}
