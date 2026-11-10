import {
  Building,
  Building2,
  Camera,
  Globe,
  Handshake,
  KeyRound,
  LayoutGrid,
  MapPin,
  Megaphone,
  MoreHorizontal,
  Share2,
  Tag,
  ThumbsUp,
  type LucideIcon,
} from 'lucide-react'
import type { LeadSource } from '@/types'

export interface LeadSourceMeta {
  value: LeadSource
  label: string
  icon: LucideIcon
  // Cor do gráfico de origem em Relatórios
  color: string
}

// Espelho de LEAD_SOURCES do backend (src/modules/leads/lead-sources.ts): mesma ordem, mesmos valores
// e rótulos. Formulários, filtros, cartões e o gráfico de Relatórios leem daqui
export const LEAD_SOURCES: LeadSourceMeta[] = [
  { value: 'instagram', label: 'Instagram', icon: Camera, color: '#E1306C' },
  { value: 'facebook', label: 'Facebook', icon: ThumbsUp, color: '#0070F3' },
  { value: 'indicacao', label: 'Indicação', icon: Handshake, color: '#008A05' },
  { value: 'site', label: 'Site', icon: Globe, color: '#7C3AED' },
  { value: 'plantao', label: 'Plantão', icon: MapPin, color: '#C45800' },
  { value: 'portais', label: 'Portais', icon: LayoutGrid, color: '#767676' },
  { value: 'google_ads', label: 'Google Ads', icon: Megaphone, color: '#B45309' },
  { value: 'meta_ads', label: 'Meta Ads', icon: Share2, color: '#0EA5E9' },
  { value: 'zap_imoveis', label: 'ZAP Imóveis', icon: Building2, color: '#E31C5F' },
  { value: 'vivareal', label: 'VivaReal', icon: Building, color: '#14B8A6' },
  { value: 'olx', label: 'OLX', icon: Tag, color: '#9333EA' },
  { value: 'chaves_na_mao', label: 'Chaves na Mão', icon: KeyRound, color: '#D93B30' },
  { value: 'outro', label: 'Outro', icon: MoreHorizontal, color: '#DDDDDD' },
]

export const LEAD_SOURCE_VALUES = LEAD_SOURCES.map((source) => source.value) as [LeadSource, ...LeadSource[]]

const FALLBACK: Omit<LeadSourceMeta, 'value'> = { label: 'Outro', icon: MoreHorizontal, color: '#DDDDDD' }

/** Origem desconhecida (gravada por uma versão mais nova do backend) cai em "Outro" em vez de quebrar a tela */
export function leadSourceMeta(value: string | null | undefined): Omit<LeadSourceMeta, 'value'> {
  if (!value) return FALLBACK
  const found = LEAD_SOURCES.find((source) => source.value === value)
  return found ?? { ...FALLBACK, label: value }
}
