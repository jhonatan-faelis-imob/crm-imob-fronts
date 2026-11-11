import { create } from 'zustand'

// 402 da API (assinatura bloqueada ou limite de usuários): o interceptor abre, o PaymentRequiredDialog mostra

export type PaywallCode = 'SUBSCRIPTION_BLOCKED' | 'SEAT_LIMIT' | 'OUTRO'

interface PaywallStore {
  open: boolean
  code: PaywallCode
  message: string
  show: (code: PaywallCode, message: string) => void
  close: () => void
}

export const usePaywallStore = create<PaywallStore>()((set) => ({
  open: false,
  code: 'OUTRO',
  message: '',
  show: (code, message) => set({ open: true, code, message }),
  close: () => set({ open: false }),
}))

/** Lê o corpo do 402 ({ code, message }) */
export function paywallFromResponse(data: unknown): { code: PaywallCode; message: string } {
  const body = (typeof data === 'object' && data !== null ? data : {}) as { code?: unknown; message?: unknown }
  const code: PaywallCode = body.code === 'SUBSCRIPTION_BLOCKED' || body.code === 'SEAT_LIMIT' ? body.code : 'OUTRO'
  const message =
    typeof body.message === 'string' ? body.message : 'Esta ação não está disponível no seu plano. Fale com o suporte.'
  return { code, message }
}
