'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, Columns3, Lock, Plus } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'
import { EmptyState } from '@/components/ui/empty-state'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from '@/components/ui/toast'
import { stageError } from '@/features/funil/api'
import { canManageFunnel, type ApiStage } from '@/features/funil/constants'
import { DeleteStageDialog } from '@/features/funil/delete-stage-dialog'
import { MoveLeadsDialog, type MoveIntent } from '@/features/funil/move-leads-dialog'
import { StageDialog } from '@/features/funil/stage-dialog'
import { StageList } from '@/features/funil/stage-list'
import { TerminalStageDialog } from '@/features/funil/terminal-stage-dialog'
import { invalidateFunnelQueries } from '@/features/funil/use-funnel-actions'
import { useHydrated } from '@/lib/use-hydrated'
import { funnelStagesService } from '@/services/funnel-stages.service'
import { useAuthStore } from '@/store/auth.store'

const STAGES_KEY = ['funnel-stages']

export default function FunilPage() {
  const queryClient = useQueryClient()
  const isHydrated = useHydrated()
  const user = useAuthStore((state) => state.user)
  const canManage = isHydrated && canManageFunnel(user)

  const { data, isLoading, isError } = useQuery<ApiStage[]>({
    queryKey: STAGES_KEY,
    queryFn: funnelStagesService.findAll,
    enabled: canManage,
  })
  const stages = [...(data ?? [])].sort((a, b) => a.orderIndex - b.orderIndex)

  // Cada abertura remonta os formulários (estado limpo)
  const [session, setSession] = useState(0)
  const [form, setForm] = useState<{ stage: ApiStage | null } | null>(null)
  const [terminalOpen, setTerminalOpen] = useState(false)
  const [deleting, setDeleting] = useState<ApiStage | null>(null)
  const [moving, setMoving] = useState<{ stage: ApiStage; intent: MoveIntent; count: number } | null>(null)

  function openForm(stage: ApiStage | null) {
    setSession((value) => value + 1)
    setForm({ stage })
  }

  function openMove(stage: ApiStage, intent: MoveIntent, count = stage.leadsCount) {
    setSession((value) => value + 1)
    setMoving({ stage, intent, count })
  }

  // Excluir: com leads abre direto "Mover leads"; vazia, a confirmação
  function requestDelete(stage: ApiStage) {
    if (stage.leadsCount > 0) openMove(stage, 'delete')
    else setDeleting(stage)
  }

  const reorder = useMutation({
    mutationFn: (ordered: ApiStage[]) =>
      funnelStagesService.reorder(ordered.map((stage, index) => ({ id: stage.id, orderIndex: index + 1 }))),
    onMutate: async (ordered) => {
      await queryClient.cancelQueries({ queryKey: STAGES_KEY })
      const previous = queryClient.getQueryData<ApiStage[]>(STAGES_KEY)
      // Mostra a ordem nova na hora; o Kanban lê a mesma query
      queryClient.setQueryData<ApiStage[]>(
        STAGES_KEY,
        ordered.map((stage, index) => ({ ...stage, orderIndex: index + 1 })),
      )
      return { previous }
    },
    onError: (error, _ordered, context) => {
      if (context?.previous) queryClient.setQueryData(STAGES_KEY, context.previous)
      toast.add({ title: 'Não foi possível reordenar', description: stageError(error, 'Tente de novo.').message, type: 'error' })
    },
    onSettled: () => invalidateFunnelQueries(queryClient),
  })

  const header = (
    <div>
      <Link
        href="/leads"
        className="inline-flex min-h-11 items-center gap-1.5 text-sm text-muted-foreground hover:text-brand"
      >
        <ArrowLeft className="h-4 w-4" />
        Leads
      </Link>
      <p className="text-xs font-medium text-muted-foreground">Configurações</p>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-[28px] font-semibold text-brand">Etapas do funil</h1>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            Esta é a ordem das colunas do Kanban. As etapas marcadas como padrão podem ser renomeadas, mas não
            excluídas. Cada etapa pode ter tarefas automáticas em{' '}
            <Link href="/cadencias" className="font-medium text-brand hover:text-brand">
              Cadências
            </Link>
            .
          </p>
        </div>
        {canManage && (
          <button
            type="button"
            onClick={() => openForm(null)}
            className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-[8px] bg-brand px-4 text-sm font-medium text-paper hover:bg-ink sm:h-10"
          >
            <Plus className="h-4 w-4" />
            Nova etapa
          </button>
        )}
      </div>
    </div>
  )

  if (!isHydrated) {
    return (
      <div className="space-y-6">
        {header}
        <Skeleton className="h-64 rounded-[16px]" />
      </div>
    )
  }

  if (!canManage) {
    return (
      <div className="space-y-6">
        {header}
        <EmptyState
          icon={<Lock className="h-6 w-6" />}
          title="Sem acesso"
          description="Só coordenadores, gerentes e diretores editam as etapas do funil."
        />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {header}

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, index) => (
            <Skeleton key={index} className="h-[68px] rounded-[16px]" />
          ))}
        </div>
      ) : isError ? (
        <p className="rounded-[16px] border-[0.5px] border-line bg-paper p-6 text-center text-sm text-danger">
          Não foi possível carregar as etapas.
        </p>
      ) : stages.length === 0 ? (
        <EmptyState
          icon={<Columns3 className="h-6 w-6" />}
          title="Nenhuma etapa no funil"
          description="Crie a primeira etapa para montar o Kanban."
        />
      ) : (
        <StageList
          stages={stages}
          actions={{
            onEdit: openForm,
            onMove: (stage) => openMove(stage, 'move'),
            onDelete: requestDelete,
          }}
          onReorder={(ordered) => reorder.mutate(ordered)}
        />
      )}

      <StageDialog
        open={form !== null}
        stage={form?.stage ?? null}
        stages={stages}
        session={session}
        onClose={() => setForm(null)}
        onTerminal={() => setTerminalOpen(true)}
      />
      <DeleteStageDialog
        key={deleting?.id ?? 'none'}
        stage={deleting}
        onClose={() => setDeleting(null)}
        onHasLeads={(stage, count) => openMove(stage, 'delete', count || stage.leadsCount)}
      />
      <MoveLeadsDialog
        stage={moving?.stage ?? null}
        stages={stages}
        intent={moving?.intent ?? 'move'}
        count={moving?.count ?? 0}
        session={session}
        onClose={() => setMoving(null)}
      />
      <TerminalStageDialog open={terminalOpen} onClose={() => setTerminalOpen(false)} />
    </div>
  )
}
