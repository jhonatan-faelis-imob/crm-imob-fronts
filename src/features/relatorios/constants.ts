import type { LeadSource, SaleStatus } from '@/types'

export const SALE_STATUS_META: Record<SaleStatus, { label: string; bg: string; text: string }> = {
  pendente: { label: 'Pendente', bg: '#FFF3E0', text: '#C45800' },
  aprovado: { label: 'Aprovado', bg: '#EBF5FF', text: '#0070F3' },
  contrato_assinado: { label: 'Contrato assinado', bg: '#F3E8FF', text: '#7C3AED' },
  concluido: { label: 'Concluído', bg: '#E8F5E9', text: '#008A05' },
  cancelado: { label: 'Cancelado', bg: '#FFEBEE', text: '#D93B30' },
}

export const REPORT_LEAD_SOURCES: LeadSource[] = ['instagram', 'facebook', 'indicacao', 'site', 'plantao', 'portais']

export const LEAD_SOURCE_META: Record<LeadSource, { label: string; color: string }> = {
  instagram: { label: 'Instagram', color: '#E1306C' },
  facebook: { label: 'Facebook', color: '#0070F3' },
  indicacao: { label: 'Indicação', color: '#008A05' },
  site: { label: 'Site', color: '#7C3AED' },
  plantao: { label: 'Plantão', color: '#C45800' },
  portais: { label: 'Portais', color: '#767676' },
  outro: { label: 'Outro', color: '#DDDDDD' },
}

export const TEAM_CHART_COLORS = ['#FF385C', '#0070F3', '#008A05', '#7C3AED', '#C45800']
