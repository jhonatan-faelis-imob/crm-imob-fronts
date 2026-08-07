import type { Lead, LeadStatus, LeadTag } from '@/types'
import type { ApiInteraction, ApiLeadProperty } from './components/detail/api'
import type { LeadFilters } from './filters-bar'
import type { LeadFormValues } from './lead-form/schema'

export interface ApiFunnelStage {
  id: string
  name: string
  color: string
  orderIndex: number
}

export interface ApiLead {
  id: string
  organizationId: string
  ownerId: string | null
  teamId: string | null
  funnelStageId: string | null
  profile: string
  status: string
  urgency: string
  name: string
  email: string | null
  phone: string
  phone2: string | null
  birthDate: string | null
  spouseName: string | null
  spousePhone: string | null
  spouseIncome: string | number | null
  spouseCpf: string | null
  source: string
  intent: string
  propertyType: string | null
  interestValue: string | number | null
  income: string | number | null
  hasClt3Years: boolean
  fgtsValue: string | number | null
  ownResources: string | number | null
  addressCep: string | null
  addressStreet: string | null
  addressNumber: string | null
  addressComplement: string | null
  addressNeighborhood: string | null
  addressCity: string | null
  addressState: string | null
  cpf: string | null
  rg: string | null
  pis: string | null
  fatherName: string | null
  motherName: string | null
  birthplace: string | null
  nationality: string | null
  maritalStatus: string | null
  occupation: string | null
  aiScore: number | null
  aiSummary: string | null
  aiNextSteps: string | null
  aiUpdatedAt: string | null
  lostReason: string | null
  notes: string | null
  active: boolean
  lastContactAt: string | null
  createdAt: string
  updatedAt: string
  owner: { id: string; name: string; avatarUrl: string | null } | null
  funnelStage: ApiFunnelStage | null
  tags: { tag: { id: string; name: string } }[]
  _count?: { tasks: number; interactions: number }
  // Só vêm preenchidos na resposta de GET /leads/:id (detalhe) — findAll (lista) não inclui.
  interactions?: ApiInteraction[]
  properties?: ApiLeadProperty[]
}

const TERMINAL_STATUSES = new Set(['ganho', 'perdido'])

// A entidade Lead do backend não tem um campo "etapa" fixo — a etapa real vem de
// funnelStage (tabela dinâmica). O frontend foi desenhado com um enum fixo de 8 status
// que replica os nomes das etapas padrão semeadas pelo backend (ver prisma/seed.ts),
// então mapeamos pelo nome exato da etapa; etapas customizadas caem em 'novo'.
export const DEFAULT_STAGE_NAME_TO_STATUS: Record<string, LeadStatus> = {
  'novo': 'novo',
  'contato': 'contato',
  'qualificação': 'qualificacao',
  'simulação': 'simulacao',
  'agendamento': 'agendamento',
  'negociação': 'negociacao',
  'ganho': 'ganho',
  'perdido': 'perdido',
}

function deriveStatus(lead: ApiLead): LeadStatus {
  if (TERMINAL_STATUSES.has(lead.status)) return lead.status as LeadStatus

  const stageName = lead.funnelStage?.name.toLowerCase().trim()
  if (!stageName) return 'novo'

  return DEFAULT_STAGE_NAME_TO_STATUS[stageName] ?? 'novo'
}

// Resolve a etapa real (com nome/cor de verdade, inclusive customizada) de um lead já
// mapeado para o tipo do frontend: usa funnelStageId quando aponta pra uma etapa
// existente, e cai no status derivado (novo/ganho/perdido) quando não há etapa setada.
export function resolveLeadStage(
  lead: Pick<Lead, 'funnelStageId' | 'status'>,
  stages: ApiFunnelStage[],
): ApiFunnelStage | undefined {
  if (lead.funnelStageId) {
    const stage = stages.find((s) => s.id === lead.funnelStageId)
    if (stage) return stage
  }

  return stages.find((s) => DEFAULT_STAGE_NAME_TO_STATUS[s.name.toLowerCase().trim()] === lead.status)
}

export function isLostStageName(name: string): boolean {
  return name.toLowerCase().trim() === 'perdido'
}

// Deriva um badge (bg pastel + texto na cor cheia) a partir da cor única armazenada na
// etapa, já que o backend guarda só uma cor por etapa (não um par bg/text como o mock antigo).
export function stageBadgeStyle(stage: ApiFunnelStage): { backgroundColor: string; color: string } {
  return { backgroundColor: `${stage.color}26`, color: stage.color }
}

// Backend filtra por `status` (só novo/ganho/perdido) ou por `funnelStageId` — nunca pelo
// slug de etapa que a UI usa. Traduz o filtro de status escolhido no dropdown para o
// parâmetro correto antes de mandar pra API.
export function buildLeadsQueryParams(
  filters: LeadFilters,
  stages: ApiFunnelStage[],
): Record<string, string> {
  const params: Record<string, string> = {}

  if (filters.search) params.search = filters.search
  if (filters.source !== 'todos') params.source = filters.source
  if (filters.brokerId !== 'todos') params.ownerId = filters.brokerId

  if (filters.status !== 'todos') {
    if (filters.status === 'novo' || filters.status === 'ganho' || filters.status === 'perdido') {
      params.status = filters.status
    } else {
      const stage = stages.find(
        (s) => DEFAULT_STAGE_NAME_TO_STATUS[s.name.toLowerCase().trim()] === filters.status,
      )
      if (stage) params.funnelStageId = stage.id
    }
  }

  return params
}

function toNumber(value: string | number | null | undefined): number | undefined {
  if (value === null || value === undefined) return undefined
  return Number(value)
}

function mapTags(tags: ApiLead['tags']): LeadTag[] {
  return tags.map((relation) => ({ id: relation.tag.id, label: relation.tag.name }))
}

export function mapApiLeadToLead(lead: ApiLead): Lead {
  return {
    id: lead.id,
    organizationId: lead.organizationId,
    ownerId: lead.ownerId ?? '',
    ownerName: lead.owner?.name ?? 'Sem responsável',
    teamId: lead.teamId,
    funnelStageId: lead.funnelStageId,
    profile: lead.profile as Lead['profile'],
    status: deriveStatus(lead),
    urgency: lead.urgency as Lead['urgency'],
    tags: mapTags(lead.tags ?? []),
    name: lead.name,
    email: lead.email ?? undefined,
    phone: lead.phone,
    phone2: lead.phone2 ?? undefined,
    birthDate: lead.birthDate ?? undefined,
    spouseName: lead.spouseName ?? undefined,
    spousePhone: lead.spousePhone ?? undefined,
    spouseIncome: toNumber(lead.spouseIncome),
    spouseCpf: lead.spouseCpf ?? undefined,
    source: lead.source as Lead['source'],
    intent: lead.intent as Lead['intent'],
    propertyType: (lead.propertyType ?? undefined) as Lead['propertyType'],
    interestValue: toNumber(lead.interestValue),
    income: toNumber(lead.income),
    hasClt3Years: lead.hasClt3Years,
    fgtsValue: toNumber(lead.fgtsValue),
    ownResources: toNumber(lead.ownResources),
    addressCep: lead.addressCep ?? undefined,
    addressStreet: lead.addressStreet ?? undefined,
    addressNumber: lead.addressNumber ?? undefined,
    addressComplement: lead.addressComplement ?? undefined,
    addressNeighborhood: lead.addressNeighborhood ?? undefined,
    addressCity: lead.addressCity ?? undefined,
    addressState: lead.addressState ?? undefined,
    cpf: lead.cpf ?? undefined,
    rg: lead.rg ?? undefined,
    pis: lead.pis ?? undefined,
    fatherName: lead.fatherName ?? undefined,
    motherName: lead.motherName ?? undefined,
    birthplace: lead.birthplace ?? undefined,
    nationality: lead.nationality ?? undefined,
    maritalStatus: (lead.maritalStatus ?? undefined) as Lead['maritalStatus'],
    occupation: lead.occupation ?? undefined,
    aiScore: lead.aiScore ?? undefined,
    aiSummary: lead.aiSummary ?? undefined,
    aiNextSteps: lead.aiNextSteps ?? undefined,
    aiUpdatedAt: lead.aiUpdatedAt ?? undefined,
    lostReason: lead.lostReason ?? undefined,
    notes: lead.notes ?? undefined,
    active: lead.active,
    lastContactAt: lead.lastContactAt ?? undefined,
    hasPendingTask: (lead._count?.tasks ?? 0) > 0,
    createdAt: lead.createdAt,
    updatedAt: lead.updatedAt,
  }
}

function parseCurrency(value: string | undefined): number | undefined {
  if (!value) return undefined
  const digits = value.replace(/[^\d,]/g, '').replace(',', '.')
  const parsed = Number(digits)
  return Number.isFinite(parsed) && digits !== '' ? parsed : undefined
}

function ddmmyyyyToIso(value: string | undefined): string | undefined {
  if (!value) return undefined
  const [day, month, year] = value.split('/')
  if (!day || !month || !year) return undefined
  return `${year}-${month}-${day}`
}

// A ficha de cadastro do lead cobre campos (preponentes, escolaridade, gênero, etc.)
// que ainda não existem no schema do backend — só os campos com correspondência direta
// no CreateLeadDto são enviados; o restante permanece só na UI até o backend ganhar suporte.
export function mapFormValuesToCreateLeadDto(values: LeadFormValues): Record<string, unknown> {
  const { basic, address, extra } = values

  return {
    name: basic.name,
    phone: basic.phone,
    phone2: basic.phone2 || undefined,
    email: basic.email || undefined,
    profile: basic.isOwner ? 'proprietario' : 'interessado',
    source: basic.source,
    intent: basic.intent,
    propertyType: basic.propertyType || undefined,
    urgency: basic.urgency || undefined,
    income: parseCurrency(basic.income),
    interestValue: parseCurrency(basic.interestValue),
    fgtsValue: parseCurrency(basic.fgtsValue),
    ownResources: parseCurrency(basic.ownResources),
    hasClt3Years: basic.hasClt3Years,
    maritalStatus: basic.maritalStatus || undefined,
    cpf: basic.cpf || undefined,
    notes: basic.notes || undefined,
    ownerId: basic.responsibleBrokerId || undefined,
    addressCep: address.cep || undefined,
    addressStreet: address.street || undefined,
    addressNumber: address.number || undefined,
    addressComplement: address.complement || undefined,
    addressNeighborhood: address.neighborhood || undefined,
    addressCity: address.city || undefined,
    addressState: address.state || undefined,
    pis: extra.pis || undefined,
    birthplace: extra.birthplace || undefined,
    rg: extra.rg || undefined,
    birthDate: ddmmyyyyToIso(extra.birthDate),
    occupation: extra.occupation || undefined,
    fatherName: extra.fatherName || undefined,
    motherName: extra.motherName || undefined,
  }
}
