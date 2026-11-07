'use client'

import { useEffect, useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { isAxiosError } from 'axios'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
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
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
  SheetClose,
} from '@/components/ui/sheet'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from '@/components/ui/toast'
import { toLocalISODate } from '@/lib/date'
import { goalsService } from '@/services/goals.service'
import { FUNNEL_STAGES, type FunnelApiKey } from './constants'
import { DayPicker } from './day-picker'
import { lastRegisterableDay, type ApiAutoFill, type ApiGoal, type ApiGoalEntry, type ApiGoalSummary } from './api'
import { invalidateGoalQueries } from './invalidate-goal-queries'

const FORM_ID = 'daily-entry-form'

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
  'w-full rounded-[12px] border-[1.5px] border-neutral-200 bg-white px-3 py-2.5 text-base text-neutral-900 outline-none transition-colors focus:border-brand'
const errorClassName = 'mt-1 text-[12px] text-danger'

// Uma instância por dia (key = data): trocar de dia nunca herda o que foi digitado no anterior
function DayEntryForm({
  saved,
  autoFill,
  summary,
  onDirtyChange,
  onSave,
}: {
  saved: ApiGoalEntry | null
  autoFill: ApiAutoFill | undefined
  summary: ApiGoalSummary | undefined
  onDirtyChange: (isDirty: boolean) => void
  onSave: (data: DailyEntryFormData) => void
}) {
  const baseline = toFormValues(saved ?? autoFill)
  const {
    register,
    handleSubmit,
    control,
    setValue,
    formState: { errors },
  } = useForm<DailyEntryFormData>({
    resolver: zodResolver(dailyEntrySchema),
    values: baseline,
    // Dados recarregados depois de abrir não podem apagar o que o corretor já digitou
    resetOptions: { keepDirtyValues: true },
  })
  const currentValues = useWatch({ control })

  // formState.isDirty compara o texto do input com o número salvo e acusa diferença à toa
  const isDirty = FUNNEL_STAGES.some((stage) => Number(currentValues[stage.key]) !== baseline[stage.key])
  useEffect(() => onDirtyChange(isDirty), [isDirty, onDirtyChange])

  function fillFromSystem() {
    if (!autoFill) return
    for (const stage of FUNNEL_STAGES) {
      setValue(stage.key, autoFill[stage.apiKey], { shouldDirty: true })
    }
  }

  return (
    <>
      <div className="space-y-2 px-4">
        <p className="text-xs text-neutral-400">
          {saved
            ? 'Este dia já tem registro salvo. Salvar de novo substitui os números.'
            : 'Os números vêm das suas ligações, leads e movimentações deste dia. Ajuste se fez algo fora do sistema.'}
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

      <form id={FORM_ID} onSubmit={handleSubmit(onSave)} noValidate className="flex-1 space-y-4 px-4">
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
    </>
  )
}

export function DailyEntrySheet({
  open,
  onOpenChange,
  goal,
  summary,
  initialDate,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  goal: ApiGoal | undefined
  summary: ApiGoalSummary | undefined
  initialDate: string
}) {
  const queryClient = useQueryClient()
  const [date, setDate] = useState(initialDate)
  const [pendingDate, setPendingDate] = useState<string | null>(null)
  const [isDirty, setIsDirty] = useState(false)

  const today = toLocalISODate()
  const minDate = goal?.periodStart.slice(0, 10) ?? date
  const maxDate = goal ? lastRegisterableDay(goal, today) : today

  const autoFillQuery = useQuery({
    queryKey: ['goals-auto-fill', date],
    queryFn: () => goalsService.getAutoFill(date),
    enabled: open,
    staleTime: 0,
  })

  const entryQuery = useQuery({
    queryKey: ['goal-entries', goal?.id, date, date],
    queryFn: () => goalsService.getEntries(goal?.id ?? '', { from: date, to: date }),
    enabled: open && !!goal,
    staleTime: 0,
  })

  const isDayLoading = autoFillQuery.isPending || entryQuery.isPending

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

  function onSave(data: DailyEntryFormData) {
    const dto: Record<string, unknown> = { date }
    for (const stage of FUNNEL_STAGES) {
      dto[stage.apiKey] = data[stage.key]
    }
    upsertEntry.mutate(dto)
  }

  function requestDate(nextDate: string) {
    if (nextDate === date) return
    if (isDirty) {
      setPendingDate(nextDate)
      return
    }
    setDate(nextDate)
  }

  function discardAndChangeDate() {
    if (pendingDate) setDate(pendingDate)
    setPendingDate(null)
    setIsDirty(false)
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Registrar atividades</SheetTitle>
          <SheetDescription>Escolha o dia e confira os números.</SheetDescription>
        </SheetHeader>

        <div className="px-4">
          <DayPicker date={date} min={minDate} max={maxDate} today={today} onChange={requestDate} />
        </div>

        {isDayLoading ? (
          <div className="space-y-4 px-4">
            {FUNNEL_STAGES.map((stage) => (
              <Skeleton key={stage.key} className="h-16 rounded-[12px]" />
            ))}
          </div>
        ) : entryQuery.isError ? (
          <p className="px-4 text-sm text-danger">Não foi possível carregar este dia. Tente de novo.</p>
        ) : (
          <DayEntryForm
            key={date}
            saved={entryQuery.data?.[0] ?? null}
            autoFill={autoFillQuery.data}
            summary={summary}
            onDirtyChange={setIsDirty}
            onSave={onSave}
          />
        )}

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
            type="submit"
            form={FORM_ID}
            disabled={upsertEntry.isPending || !goal || !summary || isDayLoading || entryQuery.isError}
            className="flex-1 rounded-[8px] bg-brand px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-70"
          >
            Salvar
          </button>
        </SheetFooter>

        <AlertDialog
          open={pendingDate !== null}
          onOpenChange={(nextOpen) => {
            if (!nextOpen) setPendingDate(null)
          }}
        >
          <AlertDialogContent className="w-[calc(100%-2rem)] gap-0 rounded-2xl border-[0.5px] border-neutral-200 bg-white p-0 ring-0">
            <AlertDialogHeader className="p-4 sm:p-6">
              <AlertDialogTitle>Descartar alterações deste dia?</AlertDialogTitle>
              <AlertDialogDescription>Os números que você digitou ainda não foram salvos.</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="mx-0 mb-0 gap-2 rounded-b-2xl border-t-[0.5px] border-neutral-200 bg-white p-4 sm:p-6">
              <AlertDialogCancel className="h-11 rounded-[8px] border-[1.5px] border-neutral-200 px-4 text-neutral-600 sm:h-10">
                Continuar editando
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={discardAndChangeDate}
                className="h-11 rounded-[8px] bg-danger px-4 text-white hover:bg-danger hover:opacity-90 sm:h-10"
              >
                Descartar
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </SheetContent>
    </Sheet>
  )
}
