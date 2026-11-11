import { useQuery, type QueryClient } from '@tanstack/react-query'
import { adminService } from '@/services/admin.service'
import { billingService } from '@/services/billing.service'

export const ADMIN_ORGANIZATIONS_KEY = ['admin-organizations'] as const

/** Depois de qualquer ação do painel: lista, resumo, detalhe, a faixa do topo e os usuários */
export function invalidateAdmin(queryClient: QueryClient) {
  queryClient.invalidateQueries({ queryKey: ADMIN_ORGANIZATIONS_KEY })
  queryClient.invalidateQueries({ queryKey: ['admin-summary'] })
  queryClient.invalidateQueries({ queryKey: ['admin-organization'] })
  queryClient.invalidateQueries({ queryKey: ['billing-me'] })
  queryClient.invalidateQueries({ queryKey: ['users'] })
}

export function useAdminSummary(enabled: boolean) {
  return useQuery({ queryKey: ['admin-summary'], queryFn: adminService.summary, enabled })
}

export function useAdminOrganizations(params: { search: string; status: string }, enabled: boolean) {
  return useQuery({
    queryKey: [...ADMIN_ORGANIZATIONS_KEY, params],
    queryFn: () =>
      adminService.list({ search: params.search.trim() || undefined, status: params.status || undefined }),
    enabled,
    placeholderData: (previous) => previous,
  })
}

export function useAdminOrganization(id: string | null) {
  return useQuery({
    queryKey: ['admin-organization', id],
    queryFn: () => adminService.detail(id ?? ''),
    enabled: id !== null,
  })
}

/** Catálogo de planos (fonte única no backend) */
export function usePlans(enabled = true) {
  return useQuery({ queryKey: ['billing-plans'], queryFn: billingService.plans, staleTime: Infinity, enabled })
}
