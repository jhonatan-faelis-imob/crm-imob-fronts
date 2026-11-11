import api from '@/lib/api'

export type SubscriptionStatus = 'teste' | 'ativa' | 'atrasada' | 'bloqueada' | 'cancelada'

export interface Plan {
  id: string
  name: string
  price: number
  seats: number
  extraSeatPrice: number | null
  /** null: sem limite (Corretor: 1) */
  maxSeats: number | null
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
  /** Forma da assinatura no Asaas: CREDIT_CARD, PIX, BOLETO, UNDEFINED */
  billingType: string | null
  /** Assinatura no Asaas que não foi cancelada */
  hasSubscription: boolean
  canceledAt: string | null
  cancelReason: string | null
  /** Cobrança em aberto com fatura (link do aviso de atraso) */
  openPayment: { invoiceUrl: string; dueDate: string | null; value: number; status: string } | null
  /** Decidido pelo backend (SUPER_ADMIN_EMAILS) */
  isSuperAdmin: boolean
  /** Só para diretor */
  billing: BillingInfo | null
}

export type BillingInfoChange = Partial<Record<keyof BillingInfo, string>>

export type SubscribeBillingType = 'CREDIT_CARD' | 'PIX' | 'BOLETO'

export interface PaymentRow {
  id: string
  asaasPaymentId: string
  value: number
  status: string
  billingType: string | null
  dueDate: string | null
  paidAt: string | null
  invoiceUrl: string | null
  bankSlipUrl?: string | null
  description?: string | null
}

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
  /** Cria a assinatura no Asaas; redirectUrl é a página de pagamento do Asaas (o cartão nunca passa pelo sistema) */
  subscribe: async (input: { planId: string; seats?: number; billingType: SubscribeBillingType }) => {
    const { data } = await api.post<{ redirectUrl: string | null; subscriptionId: string }>('/billing/subscribe', input)
    return data
  },
  /** Vale a partir da próxima cobrança */
  changeSubscription: async (input: { planId?: string; seats?: number }) => {
    const { data } = await api.patch<{ plan: string; seats: number; monthlyPrice: number }>('/billing/subscription', input)
    return data
  },
  cancel: async (reason: string) => {
    const { data } = await api.post<{ canceledAt: string; accessUntil: string | null }>('/billing/subscription/cancel', { reason })
    return data
  },
  payments: async (): Promise<PaymentRow[]> => {
    const { data } = await api.get<PaymentRow[]>('/billing/payments')
    return data
  },
}
