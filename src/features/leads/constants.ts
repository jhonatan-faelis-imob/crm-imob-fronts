import type { LucideIcon } from 'lucide-react'
import type { LeadInterest, LeadSource, LeadStatus } from '@/types'
import { LEAD_SOURCES } from './sources'

export const STATUS_ORDER: LeadStatus[] = [
  'novo',
  'contato',
  'qualificacao',
  'simulacao',
  'agendamento',
  'negociacao',
]

export const STATUS_TERMINAL_ORDER: LeadStatus[] = ['ganho', 'perdido']

export const STATUS_META: Record<LeadStatus, { label: string; bg: string; text: string }> = {
  novo: { label: 'Novo', bg: '#EBF5FF', text: '#0070F3' },
  contato: { label: 'Contato', bg: '#F3E8FF', text: '#7C3AED' },
  qualificacao: { label: 'Qualificação', bg: '#FFF0F2', text: '#E31C5F' },
  simulacao: { label: 'Simulação', bg: '#FFF7E0', text: '#B45309' },
  agendamento: { label: 'Agendamento', bg: '#FFF3E0', text: '#C45800' },
  negociacao: { label: 'Negociação', bg: '#FFF0F2', text: '#FF385C' },
  ganho: { label: 'Ganho', bg: '#E8F5E9', text: '#008A05' },
  perdido: { label: 'Perdido', bg: '#FFEBEE', text: '#D93B30' },
}

// Derivado da lista única de origens (sources.ts)
export const SOURCE_META = Object.fromEntries(
  LEAD_SOURCES.map(({ value, label, icon }) => [value, { label, icon }]),
) as Record<LeadSource, { label: string; icon: LucideIcon }>

export const INTEREST_META: Record<LeadInterest, string> = {
  compra: 'Compra',
  venda: 'Venda',
  locacao: 'Locação',
}
