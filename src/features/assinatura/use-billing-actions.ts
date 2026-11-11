import { useQuery, type QueryClient } from '@tanstack/react-query'
import { billingService } from '@/services/billing.service'

/** Depois de assinar, trocar de plano, cancelar ou salvar dados de cobrança */
export function invalidateBilling(queryClient: QueryClient) {
  queryClient.invalidateQueries({ queryKey: ['billing-me'] })
  queryClient.invalidateQueries({ queryKey: ['billing-payments'] })
  queryClient.invalidateQueries({ queryKey: ['admin-organizations'] })
}

export function useBillingPayments(enabled: boolean, refetchInterval?: number | false) {
  return useQuery({
    queryKey: ['billing-payments'],
    queryFn: billingService.payments,
    enabled,
    refetchInterval,
  })
}
