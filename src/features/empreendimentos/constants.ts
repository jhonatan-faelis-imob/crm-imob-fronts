import type { PropertyStatus, PropertyType } from '@/types'

export const DEVELOPMENT_STATUSES = [
  'lancamento',
  'em_obras',
  'pronto_morar',
  'entregue',
  'esgotado',
  'suspenso',
] as const
export type DevelopmentStatus = (typeof DEVELOPMENT_STATUSES)[number]

export const RESALE_STATUSES = ['disponivel', 'reservado', 'vendido'] as const
export type ResaleStatus = (typeof RESALE_STATUSES)[number]

export const DEVELOPMENT_STATUS_META: Record<DevelopmentStatus, { label: string; bg: string; text: string }> = {
  lancamento: { label: 'Lançamento', bg: '#EBF5FF', text: '#0070F3' },
  em_obras: { label: 'Em obras', bg: '#FFF3E0', text: '#C45800' },
  pronto_morar: { label: 'Pronto para morar', bg: '#E8F5E9', text: '#008A05' },
  entregue: { label: 'Entregue', bg: '#DCFCE7', text: '#15803D' },
  esgotado: { label: 'Esgotado', bg: '#FFEBEE', text: '#D93B30' },
  suspenso: { label: 'Suspenso', bg: '#F7F7F7', text: '#484848' },
}

export const RESALE_STATUS_META: Record<ResaleStatus, { label: string; bg: string; text: string }> = {
  disponivel: { label: 'Disponível', bg: '#E8F5E9', text: '#008A05' },
  reservado: { label: 'Reservado', bg: '#FFF3E0', text: '#C45800' },
  vendido: { label: 'Vendido', bg: '#FFEBEE', text: '#D93B30' },
}

export function getStatusMeta(status: PropertyStatus) {
  if (status in DEVELOPMENT_STATUS_META) {
    return DEVELOPMENT_STATUS_META[status as DevelopmentStatus]
  }
  return RESALE_STATUS_META[status as ResaleStatus]
}

export const PROPERTY_TYPES = [
  'apartamento',
  'casa',
  'casa_condominio',
  'sobrado',
  'terreno',
  'comercial',
  'chacara',
  'rural',
  'kitnet',
  'loft',
  'outro',
] as const satisfies readonly PropertyType[]

export const PROPERTY_TYPE_META: Record<PropertyType, string> = {
  apartamento: 'Apartamento',
  casa: 'Casa',
  casa_condominio: 'Casa em condomínio',
  sobrado: 'Sobrado',
  terreno: 'Terreno',
  comercial: 'Comercial',
  chacara: 'Chácara',
  rural: 'Rural',
  kitnet: 'Kitnet',
  loft: 'Loft',
  outro: 'Outro',
}

export const CITIES = ['São Paulo', 'Rio de Janeiro', 'Campinas', 'Santos', 'Guarulhos']

export const PRICE_RANGE_OPTIONS: { id: string; label: string; min?: number; max?: number }[] = [
  { id: 'todas', label: 'Todas as faixas' },
  { id: 'ate_300000', label: 'Até R$ 300 mil', max: 300000 },
  { id: '300000_500000', label: 'R$ 300 mil – R$ 500 mil', min: 300000, max: 500000 },
  { id: '500000_800000', label: 'R$ 500 mil – R$ 800 mil', min: 500000, max: 800000 },
  { id: 'acima_800000', label: 'Acima de R$ 800 mil', min: 800000 },
]

export const BEDROOM_OPTIONS = [1, 2, 3, 4]
export const PARKING_OPTIONS = [1, 2, 3, 4]
