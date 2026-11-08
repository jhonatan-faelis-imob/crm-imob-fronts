'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Plus, RefreshCw, Workflow } from 'lucide-react'
import Link from 'next/link'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from '@/components/ui/toast'
import { canManageCadences } from '@/features/cadencias/constants'
import { invalidateCadenceQueries } from '@/features/cadencias/invalidate-cadence-queries'
import { mapApiTaskToTask } from '@/features/tarefas/api'
import { TASK_STATUS_META, TASK_TYPE_META } from '@/features/tarefas/constants'
import { useHydrated } from '@/lib/use-hydrated'
import { getInitials } from '@/lib/utils'
import { cadencesService } from '@/services/cadences.service'
import { useAuthStore } from '@/store/auth.store'
import type { Task } from '@/types'
import { formatDateTimeBR } from './format'

const secondaryButtonClassName =
  'inline-flex h-11 flex-1 items-center justify-center gap-1.5 rounded-[8px] border-[0.5px] border-neutral-200 px-3 text-sm font-medium text-neutral-600 transition-colors hover:bg-neutral-100 disabled:cursor-not-allowed disabled:opacity-60 sm:h-10'

export function CadenceCard({
  leadId,
  onOpenTask,
  onAddTask,
}: {
  leadId: string
  onOpenTask: (task: Task) => void
  onAddTask: () => void
}) {
  const queryClient = useQueryClient()
  const isHydrated = useHydrated()
  const user = useAuthStore((state) => state.user)

  const { data, isLoading, isError } = useQuery({
    queryKey: ['cadence-lead', leadId],
    queryFn: () => cadencesService.findForLead(leadId),
  })

  const reapply = useMutation({
    mutationFn: () => cadencesService.reapplyForLead(leadId),
    onSuccess: ({ created }) => {
      invalidateCadenceQueries(queryClient, leadId)
      toast.add({
        title: created.length
          ? `Criei ${created.length} ${created.length === 1 ? 'tarefa' : 'tarefas'} da cadência`
          : 'A cadência já está aplicada',
        description: created.length ? undefined : 'Todos os passos da etapa já têm tarefa pendente.',
        type: 'success',
      })
    },
    onError: () => toast.add({ title: 'Não foi possível reaplicar a cadência', type: 'error' }),
  })

  const tasks = (data?.tasks ?? []).map(mapApiTaskToTask)
  const hasSteps = (data?.steps.length ?? 0) > 0

  return (
    <div className="rounded-[16px] border-[0.5px] border-neutral-200 bg-white p-5">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-sm font-semibold text-neutral-900">Cadência</h3>
        {data?.stage && (
          <span
            className="rounded-full px-2 py-0.5 text-[11px] font-medium"
            style={{ backgroundColor: `${data.stage.color}26`, color: data.stage.color }}
          >
            {data.stage.name}
          </span>
        )}
      </div>

      {isLoading ? (
        <div className="mt-3 space-y-2">
          <Skeleton className="h-12 rounded-[12px]" />
          <Skeleton className="h-12 rounded-[12px]" />
        </div>
      ) : isError ? (
        <p className="mt-3 text-sm text-danger">Não foi possível carregar a cadência.</p>
      ) : !data?.stage ? (
        <p className="mt-3 text-sm text-neutral-400">O lead não está em nenhuma etapa do funil.</p>
      ) : (
        <>
          {!hasSteps && (
            <div className="mt-3 rounded-[12px] bg-neutral-100 p-3 text-sm text-neutral-600">
              <p>Esta etapa não tem cadência definida.</p>
              {isHydrated && canManageCadences(user) && (
                <Link
                  href="/cadencias"
                  className="mt-1 inline-flex min-h-11 items-center gap-1.5 font-medium text-brand hover:text-brand-dark sm:min-h-0"
                >
                  <Workflow className="h-4 w-4" />
                  Configurar cadências
                </Link>
              )}
            </div>
          )}

          {tasks.length > 0 && (
            <ul className="mt-3 divide-y-[0.5px] divide-neutral-200">
              {tasks.map((task) => {
                const type = TASK_TYPE_META[task.type]
                const status = TASK_STATUS_META[task.status]
                const Icon = type.icon
                return (
                  <li key={task.id}>
                    <button
                      type="button"
                      onClick={() => onOpenTask(task)}
                      className="flex min-h-11 w-full items-start gap-2.5 py-2.5 text-left"
                    >
                      <span
                        className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full"
                        style={{ backgroundColor: type.bg, color: type.text }}
                      >
                        <Icon className="h-3.5 w-3.5" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span
                          className={`block break-words text-sm font-medium ${
                            task.status === 'pendente' ? 'text-neutral-900' : 'text-neutral-400 line-through'
                          }`}
                        >
                          {task.title}
                        </span>
                        <span className="mt-1 flex flex-wrap items-center gap-1.5 text-xs text-neutral-400">
                          <span
                            className="rounded-full px-2 py-0.5 text-[11px] font-medium"
                            style={{ backgroundColor: status.bg, color: status.text }}
                          >
                            {status.label}
                          </span>
                          {formatDateTimeBR(task.dueDate)}
                        </span>
                      </span>
                      <Avatar size="sm" title={task.assignedToName}>
                        <AvatarFallback className="bg-brand-bg text-brand">
                          {getInitials(task.assignedToName)}
                        </AvatarFallback>
                      </Avatar>
                    </button>
                  </li>
                )
              })}
            </ul>
          )}

          {hasSteps && tasks.length === 0 && (
            <p className="mt-3 text-sm text-neutral-400">Nenhuma tarefa automática desta etapa ainda.</p>
          )}
        </>
      )}

      <div className="mt-4 flex gap-2">
        <button type="button" onClick={onAddTask} className={secondaryButtonClassName}>
          <Plus className="h-4 w-4" />
          Adicionar tarefa
        </button>
        {hasSteps && (
          <button
            type="button"
            onClick={() => reapply.mutate()}
            disabled={reapply.isPending}
            className={secondaryButtonClassName}
          >
            <RefreshCw className={`h-4 w-4 ${reapply.isPending ? 'animate-spin' : ''}`} />
            Reaplicar cadência
          </button>
        )}
      </div>

      <p className="mt-3 text-xs text-neutral-400">
        Alterar aqui vale só para este lead. A regra geral fica em Configurações → Cadências.
      </p>
    </div>
  )
}
