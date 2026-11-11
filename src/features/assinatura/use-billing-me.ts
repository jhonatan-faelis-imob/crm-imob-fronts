import { useQuery } from '@tanstack/react-query'
import { billingService } from '@/services/billing.service'

export const BILLING_ME_KEY = ['billing-me'] as const

/** Situação da assinatura (faixa do topo, /assinatura, menu do /admin). 5 minutos de cache */
export function useBillingMe(enabled = true) {
  return useQuery({
    queryKey: BILLING_ME_KEY,
    queryFn: billingService.me,
    staleTime: 5 * 60_000,
    enabled,
    meta: { silent: true },
  })
}

/** Superadministrador segundo o backend. Só consulta depois da hidratação e com sessão */
export function useIsSuperAdmin(isHydrated: boolean, isLogged: boolean) {
  const { data } = useBillingMe(isHydrated && isLogged)
  return data?.isSuperAdmin === true
}
