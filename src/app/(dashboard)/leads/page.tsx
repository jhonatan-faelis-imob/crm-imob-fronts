'use client'

import { useEffect, useState } from 'react'
import { List, Plus, SquareKanban, Workflow } from 'lucide-react'
import Link from 'next/link'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { isAxiosError } from 'axios'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from '@/components/ui/toast'
import { canManageCadences } from '@/features/cadencias/constants'
import { invalidateMyDayQueries } from '@/features/meu-dia/invalidate-my-day-queries'
import { FiltersBar, defaultLeadFilters, type LeadFilters } from '@/features/leads/filters-bar'
import { formatVgv, KanbanBoard } from '@/features/leads/components/kanban-board'
import { PendingSalesBanner } from '@/features/leads/components/pending-sales-banner'
import { LeadsListView } from '@/features/leads/list-view'
import { NewLeadDialog, type LeadFormInitialValues } from '@/features/leads/new-lead-dialog'
import { createdLeadToastTitle } from '@/features/leads/created-lead-toast'
import { toCurrencyMaskValue } from '@/features/leads/lead-form/from-lead'
import { useSimulationDraftStore } from '@/features/simulador/simulation-draft-store'
import {
  buildLeadsQueryParams,
  mapApiLeadToLead,
  mapFormValuesToCreateLeadDto,
  type ApiFunnelStage,
  type ApiLead,
} from '@/features/leads/api-mapper'
import type { LeadFormValues } from '@/features/leads/lead-form/schema'
import { leadsService } from '@/services/leads.service'
import { funnelStagesService } from '@/services/funnel-stages.service'
import { usersService } from '@/services/users.service'
import { useHydrated } from '@/lib/use-hydrated'
import { useAuthStore } from '@/store/auth.store'

type ViewMode = 'kanban' | 'list'

interface ApiUser {
  id: string
  name: string
  role: string
}

export default function LeadsPage() {
  const [view, setView] = useState<ViewMode>('kanban')
  const [filters, setFilters] = useState<LeadFilters>(defaultLeadFilters)
  // "Cadastrar como lead" do simulador: o rascunho (só em memória) abre o formulário preenchido
  const [simulationPrefill] = useState<LeadFormInitialValues | undefined>(() => {
    const draft = useSimulationDraftStore.getState().draft
    if (!draft) return undefined
    return {
      income: toCurrencyMaskValue(draft.income),
      fgtsValue: toCurrencyMaskValue(draft.fgtsValue),
      ownResources: toCurrencyMaskValue(draft.ownResources),
    }
  })
  const [isDialogOpen, setIsDialogOpen] = useState(simulationPrefill !== undefined)
  const [usePrefill, setUsePrefill] = useState(simulationPrefill !== undefined)
  const clearSimulationDraft = useSimulationDraftStore((state) => state.clearDraft)
  // Já foi para o estado local: o rascunho não pode reabrir o formulário numa próxima visita
  useEffect(() => {
    clearSimulationDraft()
  }, [clearSimulationDraft])
  const queryClient = useQueryClient()
  const isHydrated = useHydrated()
  const user = useAuthStore((state) => state.user)
  // Depois da hidratação: o usuário vem do localStorage e o HTML do servidor não o conhece
  const showCadences = isHydrated && canManageCadences(user)

  const { data: stages } = useQuery<ApiFunnelStage[]>({
    queryKey: ['funnel-stages'],
    queryFn: funnelStagesService.findAll,
  })

  const { data: brokers } = useQuery<ApiUser[]>({
    queryKey: ['users'],
    queryFn: () => usersService.findAll(),
  })
  const brokerOptions = (brokers ?? []).filter((user) => user.role !== 'administrativo')

  const queryParams = buildLeadsQueryParams(filters, stages ?? [])

  const { data: leadsData, isLoading } = useQuery<{ data: ApiLead[] }>({
    queryKey: ['leads', queryParams],
    queryFn: () => leadsService.findAll({ ...queryParams, limit: '100' }),
    enabled: stages !== undefined,
  })

  const createLead = useMutation({
    mutationFn: (dto: Record<string, unknown>) => leadsService.create(dto),
    onSuccess: (lead) => {
      queryClient.invalidateQueries({ queryKey: ['leads'] })
      // Todo lead novo entra numa etapa e ganha as tarefas da cadência: invalida tasks, my-day e my-day-summary
      invalidateMyDayQueries(queryClient)
      toast.add({ title: createdLeadToastTitle(lead.cadence), type: 'success' })
    },
    onError: (error: unknown) => {
      if (isAxiosError(error) && error.response?.status === 409) {
        toast.add({
          title: 'Cliente já cadastrado',
          description: error.response.data?.message ?? 'Telefone já cadastrado.',
          type: 'error',
        })
        return
      }
      toast.add({ title: 'Não foi possível criar o lead', type: 'error' })
    },
  })

  async function handleSubmitLead(data: LeadFormValues) {
    await createLead.mutateAsync(mapFormValuesToCreateLeadDto(data))
  }

  const leads = (leadsData?.data ?? []).map(mapApiLeadToLead)
  const totalVgv = leads.reduce((sum, lead) => sum + (lead.interestValue ?? 0), 0)

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-[28px] font-semibold text-neutral-900">Leads</h1>
          {isLoading ? (
            <p className="mt-1 text-sm text-neutral-400">Carregando...</p>
          ) : (
            <div className="mt-1 flex items-center gap-2 text-sm text-neutral-400">
              <span>{leads.length} leads</span>
              {totalVgv > 0 && (
                <>
                  <span>·</span>
                  <span className="font-semibold text-neutral-600">{formatVgv(totalVgv)} em potencial</span>
                </>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          {showCadences && (
            <Link
              href="/cadencias"
              className="inline-flex h-11 items-center justify-center gap-2 rounded-[8px] border-[0.5px] border-neutral-200 bg-white px-3 text-sm font-medium text-neutral-600 transition-colors hover:bg-neutral-100 sm:h-10"
            >
              <Workflow className="h-4 w-4" />
              Cadências
            </Link>
          )}
          <div className="flex items-center gap-1 rounded-[8px] border-[0.5px] border-neutral-200 bg-white p-1">
            <button
              type="button"
              aria-label="Visualizar em kanban"
              onClick={() => setView('kanban')}
              className={`rounded-[6px] p-1.5 ${
                view === 'kanban' ? 'bg-brand-bg text-brand' : 'text-neutral-400 hover:bg-neutral-100'
              }`}
            >
              <SquareKanban className="h-4 w-4" />
            </button>
            <button
              type="button"
              aria-label="Visualizar em lista"
              onClick={() => setView('list')}
              className={`rounded-[6px] p-1.5 ${
                view === 'list' ? 'bg-brand-bg text-brand' : 'text-neutral-400 hover:bg-neutral-100'
              }`}
            >
              <List className="h-4 w-4" />
            </button>
          </div>

          <button
            type="button"
            onClick={() => setIsDialogOpen(true)}
            className="inline-flex items-center justify-center gap-2 rounded-[8px] bg-brand px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-brand-dark"
          >
            <Plus className="h-4 w-4" />
            Novo lead
          </button>
        </div>
      </div>

      <PendingSalesBanner />

      <FiltersBar filters={filters} onChange={setFilters} brokers={brokerOptions} />

      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-40 rounded-[16px]" />
          ))}
        </div>
      ) : view === 'kanban' ? (
        <KanbanBoard leads={leads} />
      ) : (
        <LeadsListView leads={leads} />
      )}

      <NewLeadDialog
        open={isDialogOpen}
        onOpenChange={(open) => {
          setIsDialogOpen(open)
          if (!open) setUsePrefill(false)
        }}
        initialValues={usePrefill ? simulationPrefill : undefined}
        brokers={brokerOptions}
        onSubmitLead={handleSubmitLead}
      />
    </div>
  )
}
