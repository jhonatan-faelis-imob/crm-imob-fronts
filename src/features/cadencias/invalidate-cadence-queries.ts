import type { QueryClient } from '@tanstack/react-query'
import { invalidateMyDayQueries } from '@/features/meu-dia/invalidate-my-day-queries'

// ['cadences'] e, via invalidateMyDayQueries, ['cadence-lead'], ['tasks'], ['my-day'], ['my-day-summary'] e ['lead', id]
export function invalidateCadenceQueries(queryClient: QueryClient, leadId?: string) {
  queryClient.invalidateQueries({ queryKey: ['cadences'] })
  invalidateMyDayQueries(queryClient, leadId)
}
