'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { isAxiosError } from 'axios'
import { useMutation, useQueryClient } from '@tanstack/react-query'
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
import { FUNNEL_STAGES } from './constants'
import type { ApiGoal, ApiGoalDailyEntry, ApiGoalSummary } from './api'

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

function toFormValues(entry: ApiGoalDailyEntry | null): DailyEntryFormData {
  return {
    ligacoes: entry?.calls ?? 0,
    prospeccoes: entry?.prospects ?? 0,
    qualificacoes: entry?.qualifications ?? 0,
    simulacoes: entry?.simulations ?? 0,
    agendamentos: entry?.appointments ?? 0,
    fechamentos: entry?.closings ?? 0,
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

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<DailyEntryFormData>({
    resolver: zodResolver(dailyEntrySchema),
    values: toFormValues(todayEntry ?? null),
  })

  const upsertEntry = useMutation({
    mutationFn: (dto: Record<string, unknown>) => {
      if (!goal) throw new Error('Nenhuma meta individual encontrada')
      return goalsService.upsertDailyEntry(goal.id, dto)
    },
    onSuccess: () => {
      for (const queryKey of [
        ['goals'],
        ['goal', goal?.id],
        ['goal-summary', goal?.id],
        ['dashboard'],
        ['reports-broker-ranking'],
      ]) {
        queryClient.invalidateQueries({ queryKey })
      }
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

        <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex-1 space-y-4 px-4">
          {FUNNEL_STAGES.map((stage) => (
            <div key={stage.key}>
              <div className="flex flex-wrap items-center justify-between gap-x-2">
                <label htmlFor={stage.key} className="text-[13px] font-medium text-neutral-900">
                  {stage.label}
                </label>
                <span className="text-xs text-neutral-400">
                  Meta do dia: {summary?.funnel?.dailyTarget[stage.apiKey] ?? 0} · Falta no período:{' '}
                  {summary?.funnel?.remaining[stage.apiKey] ?? 0}
                </span>
              </div>
              <input
                id={stage.key}
                type="number"
                min="0"
                step="1"
                className={`mt-1.5 ${inputClassName}`}
                {...register(stage.key)}
              />
              {errors[stage.key] && <p className={errorClassName}>{errors[stage.key]?.message}</p>}
            </div>
          ))}
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
            disabled={isSubmitting || upsertEntry.isPending || !goal || !summary}
            className="flex-1 rounded-[8px] bg-brand px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-70"
          >
            Salvar
          </button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
