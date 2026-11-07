import type { QueryClient } from '@tanstack/react-query'

const AFFECTED_KEYS = [
  'my-day',
  'my-day-summary',
  'tasks',
  'tasks-summary',
  'leads',
  'interactions',
  'goals-auto-fill',
  'dashboard',
]

export function invalidateMyDayQueries(queryClient: QueryClient, leadId?: string) {
  for (const key of AFFECTED_KEYS) {
    queryClient.invalidateQueries({ queryKey: [key] })
  }
  queryClient.invalidateQueries({ queryKey: leadId ? ['lead', leadId] : ['lead'] })
}
