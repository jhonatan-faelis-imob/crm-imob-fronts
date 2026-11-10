import { useState } from 'react'
import { FileCheck, MessageSquareText, Plug, UsersRound, Workflow, type LucideIcon } from 'lucide-react'
import { canManageCadences } from '@/features/cadencias/constants'
import { canManageDocuments } from '@/features/documentos/constants'
import { canManageIntegrations } from '@/features/integracoes/constants'

export interface SettingsNavItem {
  href: string
  label: string
  icon: LucideIcon
  // Sem regra = visível para todos
  canSee?: (role: string) => boolean
}

// Lista estática: é ela que vai para a primeira renderização (servidor e cliente iguais)
export const SETTINGS_NAV_ITEMS: SettingsNavItem[] = [
  { href: '/mensagens', label: 'Mensagens', icon: MessageSquareText },
  // Equipe continua visível para todos, como era no menu principal
  { href: '/equipe', label: 'Equipe', icon: UsersRound },
  { href: '/cadencias', label: 'Cadências', icon: Workflow, canSee: (role) => canManageCadences({ role }) },
  { href: '/documentos', label: 'Documentos', icon: FileCheck, canSee: (role) => canManageDocuments({ role }) },
  { href: '/integracoes', label: 'Integrações', icon: Plug, canSee: (role) => canManageIntegrations({ role }) },
]

export function isNavItemActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`)
}

export function isSettingsPath(pathname: string) {
  return SETTINGS_NAV_ITEMS.some(({ href }) => isNavItemActive(pathname, href))
}

// Antes da montagem não há cargo confiável (vem do localStorage): mostra a lista completa
export function visibleSettingsItems(isMounted: boolean, role: string | undefined) {
  if (!isMounted) return SETTINGS_NAV_ITEMS
  return SETTINGS_NAV_ITEMS.filter((item) => !item.canSee || (role !== undefined && item.canSee(role)))
}

// Aberto/fechado só vale para o pathname em que foi escolhido: ao entrar numa rota de
// Configurações o grupo abre sozinho, fora delas começa recolhido
export function useSettingsGroup(pathname: string) {
  const [choice, setChoice] = useState<{ pathname: string; open: boolean } | null>(null)
  const isActive = isSettingsPath(pathname)
  const isOpen = choice?.pathname === pathname ? choice.open : isActive
  return { isActive, isOpen, toggle: () => setChoice({ pathname, open: !isOpen }) }
}
