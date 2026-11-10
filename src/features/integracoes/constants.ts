import { Building2, Home, Megaphone, Share2, Sparkles, type LucideIcon } from 'lucide-react'
import { isAxiosError } from 'axios'
import type {
  IntegrationEventStatus,
  IntegrationGroup,
  IntegrationProvider,
  IntegrationStatus,
} from '@/services/integrations.service'

// Mesma regra do backend (@Roles('gerente')): gerente e diretor
const MANAGE_ROLES = new Set(['gerente', 'diretor'])

export function canManageIntegrations(user: { role: string } | null | undefined) {
  return !!user && MANAGE_ROLES.has(user.role)
}

export const INTEGRATIONS_QUERY_KEY = ['integrations'] as const

export const GROUPS: { value: IntegrationGroup; label: string }[] = [
  { value: 'portais', label: 'Portais imobiliários' },
  { value: 'anuncios', label: 'Redes sociais e anúncios' },
  { value: 'ia', label: 'Inteligência artificial' },
]

// Ícones genéricos do lucide-react: nada de logotipos de marcas
export const PROVIDER_ICON: Record<IntegrationProvider, LucideIcon> = {
  grupo_olx: Building2,
  chaves_na_mao: Home,
  meta: Share2,
  google_ads: Megaphone,
  ai: Sparkles,
}

export const STATUS_META: Record<IntegrationStatus, { label: string; className: string }> = {
  desativada: { label: 'Desativada', className: 'bg-neutral-100 text-neutral-600' },
  aguardando: { label: 'Aguardando', className: 'bg-[#FFF7E0] text-[#B45309]' },
  ativa: { label: 'Ativa', className: 'bg-[#E8F5E9] text-success' },
  erro: { label: 'Erro', className: 'bg-danger-bg text-danger' },
  em_breve: { label: 'Em breve', className: 'bg-[#EBF5FF] text-[#0070F3]' },
}

export const EVENT_STATUS_META: Record<IntegrationEventStatus, { label: string; className: string }> = {
  ok: { label: 'OK', className: 'bg-[#E8F5E9] text-success' },
  ignorado: { label: 'Ignorado', className: 'bg-neutral-100 text-neutral-600' },
  erro: { label: 'Erro', className: 'bg-danger-bg text-danger' },
  teste: { label: 'Teste', className: 'bg-[#EBF5FF] text-[#0070F3]' },
}

/** "há 5 minutos", "há 2 horas", "há 3 dias" */
export function timeAgo(iso: string, now = Date.now()) {
  const minutes = Math.max(0, Math.round((now - new Date(iso).getTime()) / 60_000))
  if (minutes < 1) return 'agora há pouco'
  if (minutes < 60) return `há ${minutes} ${minutes === 1 ? 'minuto' : 'minutos'}`
  const hours = Math.round(minutes / 60)
  if (hours < 24) return `há ${hours} ${hours === 1 ? 'hora' : 'horas'}`
  const days = Math.round(hours / 24)
  return `há ${days} ${days === 1 ? 'dia' : 'dias'}`
}

export function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })
}

export function apiMessage(error: unknown, fallback: string) {
  if (!isAxiosError(error)) return fallback
  const message: unknown = (error.response?.data as { message?: unknown } | undefined)?.message
  if (Array.isArray(message)) return message.filter((item): item is string => typeof item === 'string').join(' · ') || fallback
  return typeof message === 'string' ? message : fallback
}
