import api from '@/lib/api'

export type SubscriptionStatus = 'teste' | 'ativa' | 'atrasada' | 'bloqueada' | 'cancelada'

export interface Plan {
  id: string
  name: string
  price: number
  seats: number
  extraSeatPrice: number | null
}

export interface BillingInfo {
  billingName: string | null
  billingDocument: string | null
  billingEmail: string | null
  billingPhone: string | null
}

export interface BillingMe {
  plan: string
  planName: string
  seats: number
  seatsUsed: number
  status: SubscriptionStatus
  trialEndsAt: string | null
  currentPeriodEnd: string | null
  daysLeft: number | null
  monthlyPrice: number | null
  warning: string | null
  /** aviso: âmbar; bloqueio: vermelho */
  warningLevel: 'aviso' | 'bloqueio' | null
  /** Decidido pelo backend (SUPER_ADMIN_EMAILS) */
  isSuperAdmin: boolean
  /** Só para diretor */
  billing: BillingInfo | null
}

export type BillingInfoChange = Partial<Record<keyof BillingInfo, string>>

export const billingService = {
  me: async (): Promise<BillingMe> => {
    const { data } = await api.get<BillingMe>('/billing/me')
    return data
  },
  plans: async (): Promise<Plan[]> => {
    const { data } = await api.get<Plan[]>('/billing/plans')
    return data
  },
  updateBillingInfo: async (change: BillingInfoChange): Promise<BillingInfo> => {
    const { data } = await api.patch<BillingInfo>('/billing/me', change)
    return data
  },
}
