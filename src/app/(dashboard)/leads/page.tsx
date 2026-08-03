'use client'

import { useState } from 'react'
import { List, Plus, SquareKanban } from 'lucide-react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from '@/components/ui/toast'
import { FiltersBar, defaultLeadFilters, type LeadFilters } from '@/features/leads/filters-bar'
import { KanbanBoard } from '@/features/leads/components/kanban-board'
import { LeadsListView } from '@/features/leads/list-view'
import { NewLeadDialog } from '@/features/leads/new-lead-dialog'
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

type ViewMode = 'kanban' | 'list'

interface ApiUser {
  id: string
  name: string
  role: string
}

export default function LeadsPage() {
  const [view, setView] = useState<ViewMode>('kanban')
  const [filters, setFilters] = useState<LeadFilters>(defaultLeadFilters)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const queryClient = useQueryClient()

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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] })
      toast.add({ title: 'Lead criado com sucesso!', type: 'success' })
    },
    onError: () => {
      toast.add({ title: 'Não foi possível criar o lead', type: 'error' })
    },
  })

  async function handleSubmitLead(data: LeadFormValues) {
    await createLead.mutateAsync(mapFormValuesToCreateLeadDto(data))
  }

  const leads = (leadsData?.data ?? []).map(mapApiLeadToLead)

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-[28px] font-semibold text-neutral-900">Leads</h1>
          <p className="mt-1 text-sm text-neutral-400">
            {isLoading ? 'Carregando...' : `${leads.length} leads`}
          </p>
        </div>

        <div className="flex items-center gap-2">
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
        onOpenChange={setIsDialogOpen}
        brokers={brokerOptions}
        onSubmitLead={handleSubmitLead}
      />
    </div>
  )
}
