import { LEAD_SOURCES } from '@/features/leads/sources'
import type { LeadSource, SaleStatus } from '@/types'

export const SALE_STATUS_META: Record<SaleStatus, { label: string; bg: string; text: string }> = {
  pendente: { label: 'Pendente', bg: '#FFF3E0', text: '#C45800' },
  aprovado: { label: 'Aprovado', bg: '#EBF5FF', text: '#0070F3' },
  contrato_assinado: { label: 'Contrato assinado', bg: '#F3E8FF', text: '#7C3AED' },
  concluido: { label: 'Concluído', bg: '#E8F5E9', text: '#008A05' },
  cancelado: { label: 'Cancelado', bg: '#FFEBEE', text: '#D93B30' },
}

// Rótulos e cores vêm da lista única de origens (features/leads/sources.ts)
export const LEAD_SOURCE_META = Object.fromEntries(
  LEAD_SOURCES.map(({ value, label, color }) => [value, { label, color }]),
) as Record<LeadSource, { label: string; color: string }>

export const TEAM_CHART_COLORS = ['#FF385C', '#0070F3', '#008A05', '#7C3AED', '#C45800']
