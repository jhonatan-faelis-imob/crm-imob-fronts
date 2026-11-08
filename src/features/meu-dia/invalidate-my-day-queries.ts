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
  // Seção "Cadência" do detalhe do lead: lista as tarefas automáticas da etapa
  'cadence-lead',
]

export function invalidateMyDayQueries(queryClient: QueryClient, leadId?: string) {
  for (const key of AFFECTED_KEYS) {
    queryClient.invalidateQueries({ queryKey: [key] })
  }
  queryClient.invalidateQueries({ queryKey: leadId ? ['lead', leadId] : ['lead'] })
}
