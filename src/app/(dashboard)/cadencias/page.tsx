'use client'

import { Accordion } from '@base-ui/react/accordion'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, ChevronDown, Lock, Workflow } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { EmptyState } from '@/components/ui/empty-state'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from '@/components/ui/toast'
import { CadenceStepDialog } from '@/features/cadencias/components/cadence-step-dialog'
import { StageSteps } from '@/features/cadencias/components/stage-steps'
import { canManageCadences } from '@/features/cadencias/constants'
import { useHydrated } from '@/lib/use-hydrated'
import { useIsMobile } from '@/lib/use-is-mobile'
import { cadencesService } from '@/services/cadences.service'
import { useAuthStore } from '@/store/auth.store'
import type { CadenceStage, CadenceStep } from '@/types'

function StageHeader({ stage }: { stage: CadenceStage }) {
  const activeCount = stage.cadenceSteps.filter((step) => step.active).length
  return (
    <div className="flex min-w-0 items-center gap-2.5">
      <span className="h-3 w-3 shrink-0 rounded-full" style={{ backgroundColor: stage.color }} />
      <h2 className="truncate text-base font-semibold text-neutral-900">{stage.name}</h2>
      <span
        className="shrink-0 rounded-full px-2 py-0.5 text-xs font-medium"
        style={{ backgroundColor: `${stage.color}26`, color: stage.color }}
      >
        {activeCount} {activeCount === 1 ? 'ativo' : 'ativos'}
      </span>
    </div>
  )
}

export default function CadenciasPage() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const isHydrated = useHydrated()
  const isMobile = useIsMobile()
  const user = useAuthStore((state) => state.user)
  const canManage = canManageCadences(user)

  const [dialog, setDialog] = useState<{ stage: CadenceStage | null; step: CadenceStep | null } | null>(null)
  // Cada abertura remonta o formulário com os valores do passo escolhido
  const [dialogSession, setDialogSession] = useState(0)
  const [deleting, setDeleting] = useState<CadenceStep | null>(null)
  const [togglingId, setTogglingId] = useState<string | null>(null)

  const { data: stages, isLoading, isError } = useQuery({
    queryKey: ['cadences'],
    queryFn: cadencesService.findAll,
    enabled: isHydrated && canManage,
  })

  const toggleStep = useMutation({
    mutationFn: ({ step, active }: { step: CadenceStep; active: boolean }) =>
      cadencesService.updateStep(step.id, { active }),
    onMutate: ({ step }) => setTogglingId(step.id),
    onSuccess: (_data, { active }) => {
      queryClient.invalidateQueries({ queryKey: ['cadences'] })
      toast.add({ title: active ? 'Passo ativado' : 'Passo desativado', type: 'success' })
    },
    onError: () => toast.add({ title: 'Não foi possível alterar o passo', type: 'error' }),
    onSettled: () => setTogglingId(null),
  })

  const removeStep = useMutation({
    mutationFn: (step: CadenceStep) => cadencesService.removeStep(step.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cadences'] })
      toast.add({ title: 'Passo excluído', type: 'success' })
      setDeleting(null)
    },
    onError: () => toast.add({ title: 'Não foi possível excluir o passo', type: 'error' }),
  })

  function openDialog(stage: CadenceStage | null, step: CadenceStep | null) {
    setDialog({ stage, step })
    setDialogSession((session) => session + 1)
  }

  if (!isHydrated) {
    return <Skeleton className="h-64 rounded-[16px]" />
  }

  if (!canManage) {
    return (
      <EmptyState
        icon={<Lock className="h-6 w-6" />}
        title="Acesso restrito"
        description="Só gerentes e diretores configuram as cadências da imobiliária."
        action={{ label: 'Voltar para Leads', onClick: () => router.push('/leads') }}
      />
    )
  }

  const totalSteps = (stages ?? []).reduce((sum, stage) => sum + stage.cadenceSteps.length, 0)
  const isLastStep = totalSteps === 1

  const stageSteps = (stage: CadenceStage) => (
    <StageSteps
      stage={stage}
      togglingId={togglingId}
      onAdd={() => openDialog(stage, null)}
      onEdit={(step) => openDialog(stage, step)}
      onDelete={setDeleting}
      onToggle={(step, active) => toggleStep.mutate({ step, active })}
    />
  )

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/leads"
          className="inline-flex min-h-11 items-center gap-1.5 text-sm text-neutral-400 hover:text-neutral-900"
        >
          <ArrowLeft className="h-4 w-4" />
          Leads
        </Link>
        <h1 className="text-[28px] font-semibold text-neutral-900">Cadências</h1>
        <p className="mt-1 max-w-2xl text-sm text-neutral-400">
          Quando um lead entra numa etapa, o sistema cria estas tarefas para o corretor responsável. Quando o lead
          sai, as pendentes são canceladas. Tarefas criadas por você nunca são alteradas.
        </p>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-36 rounded-[16px]" />
          ))}
        </div>
      ) : isError ? (
        <p className="rounded-[16px] border-[0.5px] border-neutral-200 bg-white p-6 text-center text-sm text-danger">
          Não foi possível carregar as cadências.
        </p>
      ) : !stages || stages.length === 0 ? (
        <EmptyState
          icon={<Workflow className="h-6 w-6" />}
          title="Nenhuma etapa no funil"
          description="Crie as etapas do funil para configurar as tarefas automáticas de cada uma."
        />
      ) : isMobile ? (
        <Accordion.Root multiple className="space-y-3">
          {stages.map((stage) => (
            <Accordion.Item
              key={stage.id}
              value={stage.id}
              className="overflow-hidden rounded-[16px] border-[0.5px] border-neutral-200 bg-white"
            >
              <Accordion.Header>
                <Accordion.Trigger className="group flex min-h-14 w-full items-center justify-between gap-3 px-4 text-left">
                  <StageHeader stage={stage} />
                  <ChevronDown className="h-4 w-4 shrink-0 text-neutral-400 transition-transform group-data-[panel-open]:rotate-180" />
                </Accordion.Trigger>
              </Accordion.Header>
              <Accordion.Panel className="border-t-[0.5px] border-neutral-200 px-4 pb-4 pt-1">
                {stageSteps(stage)}
              </Accordion.Panel>
            </Accordion.Item>
          ))}
        </Accordion.Root>
      ) : (
        <div className="space-y-4">
          {stages.map((stage) => (
            <section
              key={stage.id}
              className="overflow-hidden rounded-[16px] border-[0.5px] border-neutral-200 bg-white"
            >
              <div className="h-1" style={{ backgroundColor: stage.color }} />
              <div className="p-5">
                <StageHeader stage={stage} />
                <div className="mt-3">{stageSteps(stage)}</div>
              </div>
            </section>
          ))}
        </div>
      )}

      <CadenceStepDialog
        key={dialogSession}
        open={dialog !== null}
        onOpenChange={(open) => {
          if (!open) setDialog(null)
        }}
        stage={dialog?.stage ?? null}
        step={dialog?.step ?? null}
      />

      <AlertDialog
        open={deleting !== null}
        onOpenChange={(open) => {
          if (!open) setDeleting(null)
        }}
      >
        <AlertDialogContent className="w-[calc(100%-2rem)] gap-0 rounded-2xl border-[0.5px] border-neutral-200 bg-white p-0 ring-0">
          <AlertDialogHeader className="p-4 sm:p-6">
            <AlertDialogTitle>Excluir passo?</AlertDialogTitle>
            <AlertDialogDescription>
              O passo <strong>&quot;{deleting?.title}&quot;</strong> deixa de criar tarefas. As tarefas que ele já
              criou continuam como estão.
              {isLastStep &&
                ' Este é o último passo: sem nenhum passo, os padrão voltam na próxima abertura. Para desligar a cadência, desative os passos.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mx-0 mb-0 flex-col-reverse gap-2 rounded-b-2xl border-t-[0.5px] border-neutral-200 bg-white p-4 sm:flex-row sm:justify-end sm:p-6">
            <AlertDialogCancel className="h-11 rounded-[8px] border-[1.5px] border-neutral-200 px-4 text-neutral-600 sm:h-10">
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deleting) removeStep.mutate(deleting)
              }}
              disabled={removeStep.isPending}
              className="h-11 rounded-[8px] bg-danger px-4 text-white hover:bg-danger hover:opacity-90 sm:h-10"
            >
              Sim, excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
