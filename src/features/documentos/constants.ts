import type { QueryClient } from '@tanstack/react-query'
import {
  Ban,
  CircleCheckBig,
  Circle,
  CircleCheck,
  CircleX,
  type LucideIcon,
} from 'lucide-react'
import type {
  ChecklistItem,
  ChecklistStatus,
  ChecklistSummary,
  DocumentAppliesWhen,
  DocumentCategory,
  DocumentHolder,
  LeadDocsSummary,
} from '@/types'

export const MAX_ITEM_NAME_LENGTH = 120

export const CHECKLIST_STATUSES: ChecklistStatus[] = ['pendente', 'recebido', 'aprovado', 'recusado', 'dispensado']

// pendente cinza, recebido azul, aprovado verde, recusado vermelho, dispensado cinza riscado
export const CHECKLIST_STATUS_META: Record<
  ChecklistStatus,
  { label: string; icon: LucideIcon; bg: string; text: string; strike?: boolean }
> = {
  pendente: { label: 'Pendente', icon: Circle, bg: '#F7F7F7', text: '#767676' },
  recebido: { label: 'Recebido', icon: CircleCheck, bg: '#EBF5FF', text: '#0070F3' },
  aprovado: { label: 'Aprovado', icon: CircleCheckBig, bg: '#E8F5E9', text: '#008A05' },
  recusado: { label: 'Recusado', icon: CircleX, bg: '#FFEBEE', text: '#D93B30' },
  dispensado: { label: 'Dispensado', icon: Ban, bg: '#F7F7F7', text: '#767676', strike: true },
}

export const DOCUMENT_CATEGORIES: { value: DocumentCategory; label: string }[] = [
  { value: 'pessoal', label: 'Pessoal' },
  { value: 'renda', label: 'Renda' },
  { value: 'fgts', label: 'FGTS' },
  { value: 'imovel', label: 'Imóvel' },
  { value: 'outro', label: 'Outro' },
]

export const DOCUMENT_HOLDERS: { value: DocumentHolder; label: string }[] = [
  { value: 'titular', label: 'Titular' },
  { value: 'conjuge', label: 'Cônjuge' },
]

export const APPLIES_WHEN_OPTIONS: { value: DocumentAppliesWhen; label: string }[] = [
  { value: 'always', label: 'Sempre' },
  { value: 'has_fgts', label: 'Só se o cliente tiver FGTS' },
]

export function categoryLabel(category: DocumentCategory) {
  return DOCUMENT_CATEGORIES.find((item) => item.value === category)?.label ?? 'Outro'
}

const MANAGE_ROLES = new Set(['gerente', 'diretor'])

export function canManageDocuments(user: { role: string } | null | undefined) {
  return !!user && MANAGE_ROLES.has(user.role)
}

// Texto livre de "Pedir documentos pendentes"; as variáveis são preenchidas pelo render-free
export const ASK_DOCUMENTS_MESSAGE =
  '{{saudacao}}, {{primeiro_nome}}! Para dar andamento no seu processo, ainda preciso destes documentos:\n\n{{documentos_pendentes}}\n\nConsegue me enviar por aqui? 😊'

// Mesma conta de summarizeChecklist no backend, para o update otimista
export function summarizeItems(items: ChecklistItem[]): ChecklistSummary {
  const counts = Object.fromEntries(CHECKLIST_STATUSES.map((status) => [status, 0])) as Record<ChecklistStatus, number>
  let requiredTotal = 0
  let requiredApproved = 0
  let pendingRequired = 0
  for (const item of items) {
    counts[item.status] += 1
    if (!item.required || item.status === 'dispensado') continue
    requiredTotal += 1
    if (item.status === 'aprovado') requiredApproved += 1
    if (item.status === 'pendente' || item.status === 'recusado') pendingRequired += 1
  }
  return {
    counts,
    requiredTotal,
    requiredApproved,
    percent: requiredTotal === 0 ? null : Math.round((requiredApproved / requiredTotal) * 100),
    pendingRequired,
  }
}

export function docsChipStyle(docs: Pick<LeadDocsSummary, 'requiredApproved' | 'requiredTotal'>) {
  if (docs.requiredTotal > 0 && docs.requiredApproved >= docs.requiredTotal) return { bg: '#E8F5E9', text: '#008A05' }
  if (docs.requiredApproved > 0) return { bg: '#FFF7E0', text: '#B45309' }
  return { bg: '#F7F7F7', text: '#767676' }
}

// ['lead-docs', id], ['leads'] e ['lead', id]
export function invalidateDocumentQueries(queryClient: QueryClient, leadId: string) {
  queryClient.invalidateQueries({ queryKey: ['lead-docs', leadId] })
  queryClient.invalidateQueries({ queryKey: ['leads'] })
  queryClient.invalidateQueries({ queryKey: ['lead', leadId] })
}
