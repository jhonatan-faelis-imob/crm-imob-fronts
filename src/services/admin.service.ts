import api from '@/lib/api'
import type { BillingInfo, SubscriptionStatus } from './billing.service'

export interface AdminOrganizationRow {
  id: string
  name: string
  slug: string
  plan: string
  planName: string
  seats: number
  subscriptionStatus: SubscriptionStatus
  monthlyPrice: number | null
  currentPeriodEnd: string | null
  trialEndsAt: string | null
  createdAt: string
  activeUsers: number
  leads: number
  lastAccessAt: string | null
}

export interface AdminUser {
  id: string
  name: string
  email: string
  role: string
  phone: string | null
  active: boolean
  lastLogin: string | null
  createdAt: string
}

export interface BillingEvent {
  id: string
  kind: 'plano_alterado' | 'bloqueada' | 'desbloqueada' | 'teste_estendido' | 'pagamento_registrado' | 'observacao'
  description: string
  createdBy: string | null
  createdAt: string
}

export interface AdminOrganizationDetail extends BillingInfo {
  id: string
  name: string
  slug: string
  plan: string
  planName: string
  seats: number
  subscriptionStatus: SubscriptionStatus
  monthlyPrice: number | null
  currentPeriodEnd: string | null
  trialEndsAt: string | null
  notes: string | null
  createdAt: string
  activeUsers: number
  leads: number
  suggestedPrice: number | null
  users: AdminUser[]
  billingEvents: BillingEvent[]
}

export interface AdminSummary {
  total: number
  byStatus: Record<SubscriptionStatus, number>
  trials: number
  monthlyRevenue: number
}

export interface NewOrganizationInput {
  name: string
  slug: string
  plan: string
  seats?: number
  subscriptionStatus?: SubscriptionStatus
  trialEndsAt?: string
  currentPeriodEnd?: string
  monthlyPrice?: number
  billingName?: string
  billingDocument?: string
  billingEmail?: string
  billingPhone?: string
  notes?: string
  directorName: string
  directorEmail: string
  directorPassword?: string
}

export interface CreatedOrganization {
  organization: { id: string; name: string }
  director: { id: string; name: string; email: string }
  temporaryPassword?: string
}

export interface OrganizationChange {
  name?: string
  plan?: string
  seats?: number
  subscriptionStatus?: SubscriptionStatus
  monthlyPrice?: number | null
  currentPeriodEnd?: string | null
  trialEndsAt?: string | null
  billingName?: string
  billingDocument?: string
  billingEmail?: string
  billingPhone?: string
  notes?: string
}

export interface PaymentInput {
  amount: number
  paidAt: string
  method: string
  note?: string
}

export interface RecalculateResult {
  checked: number
  changed: number
  changes: { id: string; name: string; from: string; to: string; reason: string }[]
}

export const adminService = {
  summary: async (): Promise<AdminSummary> => (await api.get<AdminSummary>('/admin/summary')).data,
  list: async (params: { search?: string; status?: string }): Promise<AdminOrganizationRow[]> =>
    (await api.get<AdminOrganizationRow[]>('/admin/organizations', { params })).data,
  detail: async (id: string): Promise<AdminOrganizationDetail> =>
    (await api.get<AdminOrganizationDetail>(`/admin/organizations/${id}`)).data,
  create: async (input: NewOrganizationInput): Promise<CreatedOrganization> =>
    (await api.post<CreatedOrganization>('/admin/organizations', input)).data,
  update: async (id: string, change: OrganizationChange) => (await api.patch(`/admin/organizations/${id}`, change)).data,
  block: async (id: string, reason: string) => (await api.post(`/admin/organizations/${id}/block`, { reason })).data,
  unblock: async (id: string, reason: string) => (await api.post(`/admin/organizations/${id}/unblock`, { reason })).data,
  registerPayment: async (id: string, input: PaymentInput) =>
    (await api.post(`/admin/organizations/${id}/register-payment`, input)).data,
  recalculate: async (): Promise<RecalculateResult> => (await api.post<RecalculateResult>('/admin/recalculate')).data,
}
