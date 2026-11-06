import type { QueryClient } from '@tanstack/react-query'

// Telas que leem vendas mas não seguem o prefixo reports-*
const SALE_QUERY_KEYS = new Set(['broker-ranking', 'sales-by-property', 'sales-history'])

function isSaleReportKey(key: unknown) {
  return typeof key === 'string' && (key.startsWith('reports-') || SALE_QUERY_KEYS.has(key))
}

export function invalidateGoalQueries(queryClient: QueryClient) {
  for (const key of ['goals', 'goal', 'goal-summary', 'goals-auto-fill', 'dashboard']) {
    queryClient.invalidateQueries({ queryKey: [key] })
  }
  queryClient.invalidateQueries({ predicate: (query) => isSaleReportKey(query.queryKey[0]) })
}
