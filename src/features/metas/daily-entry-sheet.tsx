'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
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
import { goalsService } from '@/services/goals.service'
import { FUNNEL_STAGES, WORKING_DAYS_PER_MONTH, type FunnelStageKey } from './constants'
import { goalFunnelTargets, type ApiGoal } from './api'

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

const STAGE_TO_API_FIELD: Record<FunnelStageKey, string> = {
  ligacoes: 'calls',
  prospeccoes: 'prospects',
  qualificacoes: 'qualifications',
  simulacoes: 'simulations',
  agendamentos: 'appointments',
  fechamentos: 'closings',
}

const rawTodayLabel = new Intl.DateTimeFormat('pt-BR', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
}).format(new Date())
const todayLabel = rawTodayLabel.charAt(0).toUpperCase() + rawTodayLabel.slice(1)

const inputClassName =
  'w-full rounded-[12px] border-[1.5px] border-neutral-200 bg-white px-3 py-2.5 text-[15px] text-neutral-900 outline-none transition-colors focus:border-brand'
const errorClassName = 'mt-1 text-[12px] text-danger'

export function DailyEntrySheet({
  open,
  onOpenChange,
  goal,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  goal: ApiGoal | undefined
}) {
  const queryClient = useQueryClient()
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<DailyEntryFormData>({
    resolver: zodResolver(dailyEntrySchema),
  })

  const upsertEntry = useMutation({
    mutationFn: (dto: Record<string, unknown>) => {
      if (!goal) throw new Error('Nenhuma meta individual encontrada')
      return goalsService.upsertDailyEntry(goal.id, dto)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goal-entries', goal?.id] })
      queryClient.invalidateQueries({ queryKey: ['goals'] })
      toast.add({ title: 'Atividades registradas com sucesso!', type: 'success' })
      reset()
      onOpenChange(false)
    },
    onError: () => {
      toast.add({ title: 'Não foi possível registrar as atividades', type: 'error' })
    },
  })

  function onSubmit(data: DailyEntryFormData) {
    const dto: Record<string, unknown> = { date: new Date().toISOString().slice(0, 10) }
    for (const stage of FUNNEL_STAGES) {
      dto[STAGE_TO_API_FIELD[stage.key]] = data[stage.key]
    }
    upsertEntry.mutate(dto)
  }

  const targets = goal ? goalFunnelTargets(goal) : null

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
          <SheetDescription>{todayLabel}</SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex-1 space-y-4 px-4">
          {FUNNEL_STAGES.map((stage) => {
            const monthlyMeta = targets?.[stage.key] ?? 0
            const dailyTarget = Math.max(1, Math.ceil(monthlyMeta / WORKING_DAYS_PER_MONTH))
            return (
              <div key={stage.key}>
                <div className="flex items-center justify-between">
                  <label htmlFor={stage.key} className="text-[13px] font-medium text-neutral-900">
                    {stage.label}
                  </label>
                  <span className="text-xs text-neutral-400">Meta diária: {dailyTarget}</span>
                </div>
                <input
                  id={stage.key}
                  type="number"
                  min="0"
                  step="1"
                  defaultValue="0"
                  className={`mt-1.5 ${inputClassName}`}
                  {...register(stage.key)}
                />
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
            disabled={isSubmitting || upsertEntry.isPending || !goal}
            className="flex-1 rounded-[8px] bg-brand px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-70"
          >
            Salvar
          </button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
