import type { GoalScope, GoalType } from '@/types'

export type FunnelStageKey =
  | 'ligacoes'
  | 'prospeccoes'
  | 'qualificacoes'
  | 'simulacoes'
  | 'agendamentos'
  | 'fechamentos'

export type FunnelApiKey = 'calls' | 'prospects' | 'qualifications' | 'simulations' | 'appointments' | 'closings'

export const FUNNEL_STAGES: { key: FunnelStageKey; apiKey: FunnelApiKey; label: string }[] = [
  { key: 'ligacoes', apiKey: 'calls', label: 'Ligações' },
  { key: 'prospeccoes', apiKey: 'prospects', label: 'Prospecções' },
  { key: 'qualificacoes', apiKey: 'qualifications', label: 'Qualificações' },
  { key: 'simulacoes', apiKey: 'simulations', label: 'Simulações' },
  { key: 'agendamentos', apiKey: 'appointments', label: 'Agendamentos' },
  { key: 'fechamentos', apiKey: 'closings', label: 'Fechamentos' },
]

export interface ConversionRates {
  appointmentsPerClosing: number
  simulationsPerAppointment: number
  qualificationsPerSimulation: number
  prospectsPerQualification: number
  callsPerProspect: number
}

export const DEFAULT_CONVERSION_RATES: ConversionRates = {
  appointmentsPerClosing: 3,
  simulationsPerAppointment: 2,
  qualificationsPerSimulation: 2,
  prospectsPerQualification: 3,
  callsPerProspect: 5,
}

export const CONVERSION_RATE_FIELDS: { key: keyof ConversionRates; label: string }[] = [
  { key: 'callsPerProspect', label: 'Quantas ligações, em média, para cada prospecção' },
  { key: 'prospectsPerQualification', label: 'Quantas prospecções, em média, para cada qualificação' },
  { key: 'qualificationsPerSimulation', label: 'Quantas qualificações, em média, para cada simulação' },
  { key: 'simulationsPerAppointment', label: 'Quantas simulações, em média, para cada agendamento' },
  { key: 'appointmentsPerClosing', label: 'Quantos agendamentos, em média, para cada fechamento' },
]

export const GOAL_SCOPE_META: Record<GoalScope, string> = {
  organizacao: 'Imobiliária',
  equipe: 'Equipe',
  individual: 'Individual',
}

export const GOAL_SCOPE_BADGE: Record<GoalScope, { bg: string; text: string }> = {
  organizacao: { bg: '#F3E8FF', text: '#7C3AED' },
  equipe: { bg: '#EBF5FF', text: '#0070F3' },
  individual: { bg: '#FFF0F2', text: '#FF385C' },
}

export const GOAL_TYPE_META: Record<GoalType, string> = {
  vgv: 'VGV',
  unidades: 'Unidades vendidas',
  leads: 'Leads gerados',
  visitas: 'Visitas realizadas',
  contratos: 'Contratos fechados',
}

export type Period = 'mes' | 'trimestre' | 'ano'

export const PERIOD_META: Record<Period, string> = {
  mes: 'Mês',
  trimestre: 'Trimestre',
  ano: 'Ano',
}
