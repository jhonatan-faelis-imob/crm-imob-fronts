'use client'

import { useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { isAxiosError } from 'axios'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
  SheetClose,
} from '@/components/ui/sheet'
import { toast } from '@/components/ui/toast'
import { toLocalISODate } from '@/lib/date'
import { goalsService } from '@/services/goals.service'
import { FUNNEL_STAGES, type FunnelApiKey } from './constants'
import type { ApiGoal, ApiGoalSummary } from './api'
import { invalidateGoalQueries } from './invalidate-goal-queries'

const dailyEntrySchema = z.object({
  ligacoes: z.coerce.number().int('Informe um número inteiro').min(0, 'Informe um valor válido'),
  prospeccoes: z.coerce
    .number()
    .int('Informe um número inteiro')
    .min(0, 'Informe um valor válido'),
  qualificacoes: z.coerce
    .number()
    .int('Informe um número inteiro')
    .min(0, 'Informe um valor válido'),
  simulacoes: z.coerce.number().int('Informe um número inteiro').min(0, 'Informe um valor válido'),
  agendamentos: z.coerce
    .number()
    .int('Informe um número inteiro')
    .min(0, 'Informe um valor válido'),
  fechamentos: z.coerce
    .number()
    .int('Informe um número inteiro')
    .min(0, 'Informe um valor válido'),
})

type DailyEntryFormData = z.infer<typeof dailyEntrySchema>

function formatToday() {
  const label = new Intl.DateTimeFormat('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(new Date())
  return label.charAt(0).toUpperCase() + label.slice(1)
}

function toFormValues(counts: Partial<Record<FunnelApiKey, number>> | null | undefined): DailyEntryFormData {
  return {
    ligacoes: counts?.calls ?? 0,
    prospeccoes: counts?.prospects ?? 0,
    qualificacoes: counts?.qualifications ?? 0,
    simulacoes: counts?.simulations ?? 0,
    agendamentos: counts?.appointments ?? 0,
    fechamentos: counts?.closings ?? 0,
  }
}

const inputClassName =
  'w-full rounded-[12px] border-[1.5px] border-neutral-200 bg-white px-3 py-2.5 text-[15px] text-neutral-900 outline-none transition-colors focus:border-brand'
const errorClassName = 'mt-1 text-[12px] text-danger'

export function DailyEntrySheet({
  open,
  onOpenChange,
  goal,
  summary,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  goal: ApiGoal | undefined
  summary: ApiGoalSummary | undefined
}) {
  const queryClient = useQueryClient()

  // O summary fica em cache: com a aba aberta de um dia para o outro, o "today" dele é
  // de ontem e não pode pré-popular (nem sobrescrever) o registro de hoje
  const todayDate = toLocalISODate()
  const todayEntry = summary?.today?.date.slice(0, 10) === todayDate ? summary.today : null

  const { data: autoFill, isLoading: isAutoFillLoading } = useQuery({
    queryKey: ['goals-auto-fill', todayDate],
    queryFn: () => goalsService.getAutoFill(todayDate),
    enabled: open,
    staleTime: 0,
  })

  const {
    register,
    handleSubmit,
    reset,
    control,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<DailyEntryFormData>({
    resolver: zodResolver(dailyEntrySchema),
    values: toFormValues(todayEntry ?? autoFill),
    // O auto-fill chega depois de abrir: não pode apagar o que o corretor já digitou
    resetOptions: { keepDirtyValues: true },
  })
  const currentValues = useWatch({ control })

  const upsertEntry = useMutation({
    mutationFn: (dto: Record<string, unknown>) => {
      if (!goal) throw new Error('Nenhuma meta individual encontrada')
      return goalsService.upsertDailyEntry(goal.id, dto)
    },
    onSuccess: () => {
      invalidateGoalQueries(queryClient)
      toast.add({ title: 'Registro salvo', type: 'success' })
      onOpenChange(false)
    },
    onError: (error) => {
      const message = isAxiosError(error) ? error.response?.data?.message : undefined
      toast.add({
        title: 'Não foi possível registrar as atividades',
        description: typeof message === 'string' ? message : undefined,
        type: 'error',
      })
    },
  })

  function onSubmit(data: DailyEntryFormData) {
    const dto: Record<string, unknown> = { date: toLocalISODate() }
    for (const stage of FUNNEL_STAGES) {
      dto[stage.apiKey] = data[stage.key]
    }
    upsertEntry.mutate(dto)
  }

  function fillFromSystem() {
    if (!autoFill) return
    for (const stage of FUNNEL_STAGES) {
      setValue(stage.key, autoFill[stage.apiKey], { shouldDirty: true })
    }
  }

  return (
    <Sheet
      open={open}
      onOpenChange={(nextOpen: boolean) => {
        onOpenChange(nextOpen)
        if (!nextOpen) reset()
      }}
    >
      <SheetContent className="w-full overflow-y-auto sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Registrar atividades de hoje</SheetTitle>
          <SheetDescription>{formatToday()}</SheetDescription>
        </SheetHeader>

        <div className="space-y-2 px-4">
          <p className="text-xs text-neutral-400">
            Os números vêm das suas ligações, leads e movimentações de hoje. Ajuste se fez algo fora do sistema.
          </p>
          <button
            type="button"
            onClick={fillFromSystem}
            disabled={!autoFill}
            className="rounded-[8px] border-[1.5px] border-neutral-200 px-3 py-2 text-sm font-medium text-neutral-600 transition-colors hover:border-brand hover:text-brand disabled:cursor-not-allowed disabled:opacity-60"
          >
            Atualizar com dados do sistema
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex-1 space-y-4 px-4">
          {FUNNEL_STAGES.map((stage) => {
            const systemValue = autoFill?.[stage.apiKey]
            const differsFromSystem =
              systemValue !== undefined && Number(currentValues[stage.key]) !== systemValue

            return (
              <div key={stage.key}>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <label htmlFor={stage.key} className="text-[13px] font-medium text-neutral-900">
                    {stage.label}
                  </label>
                  {systemValue !== undefined && (
                    <div className="flex items-center gap-1.5">
                      <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-[11px] font-medium text-neutral-600">
                        Sistema: {systemValue}
                      </span>
                      {differsFromSystem && (
                        <button
                          type="button"
                          onClick={() => setValue(stage.key, systemValue, { shouldDirty: true })}
                          className="rounded-[8px] px-1.5 py-0.5 text-[11px] font-medium text-brand hover:bg-brand-bg"
                        >
                          Usar {systemValue}
                        </button>
                      )}
                    </div>
                  )}
                </div>
                <input
                  id={stage.key}
                  type="number"
                  min="0"
                  step="1"
                  className={`mt-1.5 ${inputClassName}`}
                  {...register(stage.key)}
                />
                <p className="mt-1 text-xs text-neutral-400">
                  Meta do dia: {summary?.funnel?.dailyTarget[stage.apiKey] ?? 0} · Falta no período:{' '}
                  {summary?.funnel?.remaining[stage.apiKey] ?? 0}
                </p>
                {errors[stage.key] && <p className={errorClassName}>{errors[stage.key]?.message}</p>}
              </div>
            )
          })}
        </form>

        <SheetFooter className="flex-row gap-2">
          <SheetClose
            render={
              <button
                type="button"
                className="flex-1 rounded-[8px] border-[1.5px] border-neutral-900 bg-transparent px-4 py-2.5 text-sm font-medium text-neutral-900"
              />
            }
          >
            Cancelar
          </SheetClose>
          <button
            type="button"
            onClick={handleSubmit(onSubmit)}
            disabled={isSubmitting || upsertEntry.isPending || !goal || !summary || isAutoFillLoading}
            className="flex-1 rounded-[8px] bg-brand px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-70"
          >
            Salvar
          </button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
