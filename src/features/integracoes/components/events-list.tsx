'use client'

import { useQuery, useQueryClient } from '@tanstack/react-query'
import { ExternalLink, Loader2, RefreshCw } from 'lucide-react'
import Link from 'next/link'
import { useEffect, useRef } from 'react'
import { Skeleton } from '@/components/ui/skeleton'
import { invalidateMyDayQueries } from '@/features/meu-dia/invalidate-my-day-queries'
import { cn } from '@/lib/utils'
import { integrationsService, type IntegrationProvider } from '@/services/integrations.service'
import { EVENT_STATUS_META, formatDateTime, INTEGRATIONS_QUERY_KEY } from '../constants'

const POLL_MS = 15_000

export function EventsList({ provider, poll = false }: { provider: IntegrationProvider; poll?: boolean }) {
  const queryClient = useQueryClient()
  const { data: events, isLoading, isError, isFetching, refetch } = useQuery({
    queryKey: [...INTEGRATIONS_QUERY_KEY, 'events', provider],
    queryFn: () => integrationsService.events(provider, 50),
    // Enquanto o painel está aberto, a atividade se atualiza sozinha (o teste do Google aparece sem recarregar)
    refetchInterval: poll ? POLL_MS : false,
  })

  // Chegou um lead novo pela integração: leads, Meu dia e tarefas precisam mostrar
  const lastLeadEvent = useRef<string | null | undefined>(undefined)
  useEffect(() => {
    if (!events) return
    const latest = events.find((event) => event.leadId)?.id ?? null
    if (lastLeadEvent.current !== undefined && latest !== lastLeadEvent.current) {
      invalidateMyDayQueries(queryClient)
      queryClient.invalidateQueries({ queryKey: INTEGRATIONS_QUERY_KEY, exact: true })
    }
    lastLeadEvent.current = latest
  }, [events, queryClient])

  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <button
          type="button"
          onClick={() => refetch()}
          disabled={isFetching}
          className="inline-flex h-9 items-center gap-1.5 rounded-[8px] border-[1.5px] border-neutral-200 px-3 text-xs font-medium text-neutral-600 transition-colors hover:bg-neutral-100 disabled:opacity-60"
        >
          {isFetching ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
          Atualizar
        </button>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          <Skeleton className="h-14 rounded-[12px]" />
          <Skeleton className="h-14 rounded-[12px]" />
        </div>
      ) : isError ? (
        <p className="rounded-[12px] bg-danger-bg p-3 text-xs text-danger">Não foi possível carregar a atividade.</p>
      ) : !events?.length ? (
        <p className="rounded-[12px] bg-neutral-100 p-3 text-sm text-neutral-400">Nenhuma atividade ainda.</p>
      ) : (
        <ul className="divide-y-[0.5px] divide-neutral-200 rounded-[12px] border-[0.5px] border-neutral-200">
          {events.map((event) => {
            const meta = EVENT_STATUS_META[event.status]
            return (
              <li key={event.id} className="flex items-start gap-3 p-3">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={cn('rounded-full px-2 py-0.5 text-[11px] font-medium', meta.className)}>{meta.label}</span>
                    <span className="text-xs text-neutral-400">{formatDateTime(event.createdAt)}</span>
                  </div>
                  <p className="mt-1 break-words text-sm text-neutral-900">
                    {event.status === 'teste' ? 'Teste recebido ✓' : event.summary}
                  </p>
                </div>
                {event.leadId && (
                  <Link
                    href={`/leads/${event.leadId}`}
                    className="inline-flex shrink-0 items-center gap-1 text-xs font-medium text-brand hover:underline"
                  >
                    Ver lead
                    <ExternalLink className="h-3 w-3" />
                  </Link>
                )}
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
