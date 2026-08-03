export type Role = 'diretor' | 'gerente' | 'coordenador' | 'corretor' | 'administrativo'

export type LeadStatus =
  | 'novo'
  | 'contato'
  | 'qualificacao'
  | 'simulacao'
  | 'agendamento'
  | 'negociacao'
  | 'ganho'
  | 'perdido'

export type LeadProfile = 'interessado' | 'proprietario'

export type LeadSource =
  | 'instagram'
  | 'facebook'
  | 'indicacao'
  | 'site'
  | 'plantao'
  | 'portais'
  | 'outro'

export type LeadInterest = 'compra' | 'venda' | 'locacao'

export type PropertyType =
  | 'apartamento'
  | 'casa'
  | 'casa_condominio'
  | 'sobrado'
  | 'terreno'
  | 'comercial'
  | 'chacara'
  | 'rural'
  | 'kitnet'
  | 'loft'
  | 'outro'

export type TaskType = 'ligacao' | 'whatsapp' | 'email' | 'visita' | 'reuniao' | 'outro'
export type TaskStatus = 'pendente' | 'concluida' | 'cancelada'
export type TaskPriority = 'baixa' | 'media' | 'alta'

export type PropertyKind = 'empreendimento' | 'revenda'

export type PropertyStatus =
  | 'disponivel'
  | 'reservado'
  | 'vendido'
  | 'em_obras'
  | 'lancamento'
  | 'entregue'
  | 'pronto_morar'
  | 'esgotado'
  | 'suspenso'

export type LeadUrgency = 'imediato' | 'um_mes' | 'tres_meses' | 'seis_meses' | 'sem_pressa'

export type SaleStatus = 'pendente' | 'aprovado' | 'contrato_assinado' | 'concluido' | 'cancelado'

export type MessageTemplateType =
  | 'primeiro_contato'
  | 'follow_up'
  | 'agendamento'
  | 'pos_visita'
  | 'proposta'
  | 'pos_venda'

export type GoalScope = 'organizacao' | 'equipe' | 'individual'
export type GoalType = 'vgv' | 'unidades' | 'leads' | 'visitas' | 'contratos'
export type GoalPeriod = 'mensal' | 'trimestral' | 'anual' | 'custom'

export type MaritalStatus =
  | 'solteiro'
  | 'casado'
  | 'divorciado'
  | 'viuvo'
  | 'uniao_estavel'

export interface Organization {
  id: string
  name: string
  slug: string
  plan: 'free' | 'starter' | 'pro'
  active: boolean
  createdAt: string
}

export interface Team {
  id: string
  organizationId: string
  name: string
  coordinatorId: string | null
  active: boolean
  createdAt: string
}

export interface User {
  id: string
  organizationId: string
  teamId: string | null
  name: string
  email: string
  phone?: string
  role: Role
  avatarUrl?: string
  creci?: string
  active: boolean
  createdAt: string
}

export interface FunnelStage {
  id: string
  organizationId: string
  name: string
  color: string
  orderIndex: number
  isDefault: boolean
  createdAt: string
}

export interface LeadTag {
  id: string
  label: string
}

export interface Lead {
  id: string
  organizationId: string
  ownerId: string
  ownerName: string
  teamId: string | null
  funnelStageId: string | null
  profile: LeadProfile
  status: LeadStatus
  urgency?: LeadUrgency
  tags?: LeadTag[]
  name: string
  email?: string
  phone: string
  phone2?: string
  birthDate?: string
  spouseName?: string
  spousePhone?: string
  spouseIncome?: number
  spouseCpf?: string
  source: LeadSource
  intent: LeadInterest
  propertyType?: PropertyType
  interestValue?: number
  income?: number
  hasClt3Years?: boolean
  fgtsValue?: number
  ownResources?: number
  addressCep?: string
  addressStreet?: string
  addressNumber?: string
  addressComplement?: string
  addressNeighborhood?: string
  addressCity?: string
  addressState?: string
  cpf?: string
  rg?: string
  pis?: string
  fatherName?: string
  motherName?: string
  birthplace?: string
  nationality?: string
  maritalStatus?: MaritalStatus
  occupation?: string
  aiScore?: number
  aiSummary?: string
  aiNextSteps?: string
  aiUpdatedAt?: string
  lostReason?: string
  notes?: string
  active: boolean
  lastContactAt?: string
  hasPendingTask: boolean
  createdAt: string
  updatedAt: string
}

export interface Task {
  id: string
  organizationId: string
  leadId?: string
  leadName?: string
  assignedTo: string
  assignedToName: string
  createdBy: string
  parentTaskId?: string
  title: string
  description?: string
  type: TaskType
  priority: TaskPriority
  status: TaskStatus
  dueDate: string
  completedAt?: string
  hasNextTask: boolean
  nextTaskType?: TaskType
  nextTaskTitle?: string
  nextTaskDaysAfter?: number
  createdAt: string
  updatedAt: string
}

export interface Property {
  id: string
  organizationId: string
  ownerId: string
  ownerName: string
  kind: PropertyKind
  propertyType?: PropertyType
  title: string
  description?: string
  cep?: string
  address?: string
  number?: string
  complement?: string
  neighborhood?: string
  city: string
  state?: string
  totalUnits?: number
  soldUnits?: number
  startingPrice?: number
  maxPrice?: number
  price?: number
  areaM2?: number
  bedrooms?: number
  bathrooms?: number
  parkingSpots?: number
  minIncome?: number
  maxIncome?: number
  status: PropertyStatus
  launchDate?: string
  deliveryDate?: string
  saleDate?: string
  notes?: string
  internalNotes?: string
  sold: boolean
  active: boolean
  createdAt: string
  updatedAt: string
}

export interface Sale {
  id: string
  organizationId: string
  leadId?: string
  leadName?: string
  propertyId: string
  propertyTitle: string
  brokerId: string
  brokerName: string
  teamId?: string
  teamName?: string
  saleValue: number
  unitIdentifier?: string
  commissionPct?: number
  commissionValue?: number
  status: SaleStatus
  soldAt: string
  notes?: string
  createdAt: string
}

export interface SaleStatusHistory {
  id: string
  saleId: string
  status: SaleStatus
  changedBy: string
  changedByName: string
  notes?: string
  createdAt: string
}

export interface Goal {
  id: string
  organizationId: string
  teamId?: string
  userId?: string
  scope: GoalScope
  title: string
  type: GoalType
  period: GoalPeriod
  periodStart: string
  periodEnd: string
  targetVgv?: number
  avgTicket?: number
  commissionPct?: number
  goalUnits?: number
  goalCalls?: number
  goalProspects?: number
  goalQualifications?: number
  goalSimulations?: number
  goalAppointments?: number
  goalClosings?: number
  currentVgv: number
  currentUnits: number
  active: boolean
  createdAt: string
  updatedAt: string
}

export interface GoalDailyEntry {
  id: string
  goalId: string
  userId: string
  organizationId: string
  date: string
  calls: number
  prospects: number
  qualifications: number
  simulations: number
  appointments: number
  closings: number
  notes?: string
  createdAt: string
}

export interface Interaction {
  id: string
  organizationId: string
  leadId: string
  userId: string
  userName: string
  type: TaskType
  notes: string
  occurredAt: string
  createdAt: string
}

export interface Document {
  id: string
  organizationId: string
  leadId: string
  uploadedBy: string
  name: string
  type?: string
  fileUrl: string
  fileSize?: number
  mimeType?: string
  createdAt: string
}

export interface MessageTemplate {
  id: string
  organizationId: string
  type: MessageTemplateType
  title: string
  content: string
  active: boolean
  createdAt: string
  updatedAt: string
}

export interface DailyActivity {
  id: string
  organizationId: string
  userId: string
  leadId?: string
  type: TaskType
  description: string
  occurredAt: string
  createdAt: string
}
