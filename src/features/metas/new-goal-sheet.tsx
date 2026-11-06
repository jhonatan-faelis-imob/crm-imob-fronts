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
import { formatCurrency } from '@/lib/utils'
import { useAuthStore } from '@/store/auth.store'
import { goalsService } from '@/services/goals.service'
import { teamsService } from '@/services/teams.service'
import type { GoalScope, GoalType } from '@/types'
import { computeFunnelFromVgv } from './calculations'
import {
  CONVERSION_RATE_FIELDS,
  DEFAULT_CONVERSION_RATES,
  FUNNEL_STAGES,
  GOAL_SCOPE_META,
  GOAL_TYPE_META,
} from './constants'
import { allowedGoalScopes, goalToFormValues, hasFunnel, mapFormToCreateGoalDto, type ApiGoal } from './api'
import { invalidateGoalQueries } from './invalidate-goal-queries'

const SCOPE_VALUES = Object.keys(GOAL_SCOPE_META) as [GoalScope, ...GoalScope[]]
const TYPE_VALUES = Object.keys(GOAL_TYPE_META) as [GoalType, ...GoalType[]]

const rateField = z.coerce.number({ message: 'Informe um número' }).positive('Precisa ser maior que 0')

const newGoalSchema = z
  .object({
    scope: z.enum(SCOPE_VALUES, { message: 'Selecione o escopo' }),
    teamId: z.string().optional(),
    type: z.enum(TYPE_VALUES, { message: 'Selecione o tipo' }),
    startDate: z.string().min(1, 'Informe a data de início'),
    endDate: z.string().min(1, 'Informe a data de fim'),
    targetValue: z.coerce.number().optional(),
    individualVgv: z.coerce.number().optional(),
    individualTicket: z.coerce.number().optional(),
    individualCommissionPct: z.coerce.number().optional(),
    rates: z.object({
      appointmentsPerClosing: rateField,
      simulationsPerAppointment: rateField,
      qualificationsPerSimulation: rateField,
      prospectsPerQualification: rateField,
      callsPerProspect: rateField,
    }),
  })
  .superRefine((data, ctx) => {
    if (!hasFunnel(data)) {
      if (!data.targetValue || data.targetValue <= 0) {
        ctx.addIssue({ code: 'custom', message: 'Informe um valor válido', path: ['targetValue'] })
      }
      return
    }
    if (!data.individualVgv || data.individualVgv <= 0) {
      ctx.addIssue({ code: 'custom', message: 'Informe o VGV desejado', path: ['individualVgv'] })
    }
    if (!data.individualTicket || data.individualTicket <= 0) {
      ctx.addIssue({
        code: 'custom',
        message: 'Informe o ticket médio',
        path: ['individualTicket'],
      })
    }
    if (!data.individualCommissionPct || data.individualCommissionPct <= 0) {
      ctx.addIssue({
        code: 'custom',
        message: 'Informe a % de comissão',
        path: ['individualCommissionPct'],
      })
    }
  })

type NewGoalFormData = z.infer<typeof newGoalSchema>

const inputClassName =
  'w-full rounded-[12px] border-[1.5px] border-neutral-200 bg-white px-3 py-2.5 text-[15px] text-neutral-900 outline-none transition-colors focus:border-brand'
const labelClassName = 'mb-1.5 block text-[13px] font-medium text-neutral-900'
const errorClassName = 'mt-1 text-[12px] text-danger'

export function NewGoalSheet({
  open,
  onOpenChange,
  goal,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  goal?: ApiGoal
}) {
  const user = useAuthStore((state) => state.user)
  const queryClient = useQueryClient()
  const isEditing = goal !== undefined

  const {
    register,
    handleSubmit,
    control,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<NewGoalFormData>({
    resolver: zodResolver(newGoalSchema),
    defaultValues: goal ? goalToFormValues(goal) : { rates: DEFAULT_CONVERSION_RATES },
  })

  const scope = useWatch({ control, name: 'scope' })
  const type = useWatch({ control, name: 'type' })
  const rates = useWatch({ control, name: 'rates' })
  const withFunnel = hasFunnel({ scope, type })
  // Gerente e diretor não pertencem a uma equipe; o coordenador usa sempre a própria
  const canPickTeam = user?.role === 'diretor' || user?.role === 'gerente'
  const showTeamField = scope === 'equipe' && canPickTeam

  const { data: teams } = useQuery<{ id: string; name: string }[]>({
    queryKey: ['teams'],
    queryFn: teamsService.findAll,
    enabled: open && canPickTeam,
  })

  const individualVgv = useWatch({ control, name: 'individualVgv' })
  const individualTicket = useWatch({ control, name: 'individualTicket' })
  const individualCommissionPct = useWatch({ control, name: 'individualCommissionPct' })

  // Campo apagado durante a digitação vale o padrão, para a prévia não zerar o funil
  const previewRates = { ...DEFAULT_CONVERSION_RATES }
  for (const { key } of CONVERSION_RATE_FIELDS) {
    previewRates[key] = Number(rates?.[key]) || DEFAULT_CONVERSION_RATES[key]
  }

  const funnelPreview = withFunnel
    ? computeFunnelFromVgv(
        Number(individualVgv) || 0,
        Number(individualTicket) || 0,
        Number(individualCommissionPct) || 0,
        previewRates
      )
    : null

  const saveGoal = useMutation({
    mutationFn: (dto: Record<string, unknown>) =>
      isEditing ? goalsService.update(goal.id, dto) : goalsService.create(dto),
    onSuccess: () => {
      invalidateGoalQueries(queryClient)
      toast.add({ title: isEditing ? 'Meta atualizada com sucesso!' : 'Meta criada com sucesso!', type: 'success' })
      reset()
      onOpenChange(false)
    },
    onError: (error) => {
      if (isAxiosError(error) && error.response?.status === 403) {
        toast.add({
          title: 'Você não tem permissão para esta meta',
          description: error.response.data?.message,
          type: 'error',
        })
        return
      }
      toast.add({
        title: isEditing ? 'Não foi possível salvar as alterações' : 'Não foi possível criar a meta',
        type: 'error',
      })
    },
  })

  function onSubmit(data: NewGoalFormData) {
    if (showTeamField && !data.teamId) {
      setError('teamId', { message: 'Selecione a equipe' })
      return
    }
    saveGoal.mutate(mapFormToCreateGoalDto(data))
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
          <SheetTitle>{isEditing ? `Editar meta — ${goal.title}` : 'Nova meta'}</SheetTitle>
          <SheetDescription>
            {isEditing ? 'Atualize os dados da meta.' : 'Defina uma nova meta de vendas.'}
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex-1 space-y-4 px-4">
          <div>
            <label htmlFor="scope" className={labelClassName}>
              Escopo
            </label>
            <select id="scope" defaultValue="" className={inputClassName} {...register('scope')}>
              <option value="" disabled>
                Selecione o escopo
              </option>
              {allowedGoalScopes(user?.role).map((value) => (
                <option key={value} value={value}>
                  {GOAL_SCOPE_META[value]}
                </option>
              ))}
            </select>
            {errors.scope && <p className={errorClassName}>{errors.scope.message}</p>}
          </div>

          {showTeamField && (
            <div>
              <label htmlFor="teamId" className={labelClassName}>
                Equipe
              </label>
              <select id="teamId" defaultValue="" className={inputClassName} {...register('teamId')}>
                <option value="" disabled>
                  Selecione a equipe
                </option>
                {(teams ?? []).map((team) => (
                  <option key={team.id} value={team.id}>
                    {team.name}
                  </option>
                ))}
              </select>
              {errors.teamId && <p className={errorClassName}>{errors.teamId.message}</p>}
            </div>
          )}

          <div>
            <label htmlFor="type" className={labelClassName}>
              Tipo
            </label>
            <select id="type" defaultValue="" className={inputClassName} {...register('type')}>
              <option value="" disabled>
                Selecione o tipo
              </option>
              {TYPE_VALUES.map((value) => (
                <option key={value} value={value}>
                  {GOAL_TYPE_META[value]}
                </option>
              ))}
            </select>
            {errors.type && <p className={errorClassName}>{errors.type.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="startDate" className={labelClassName}>
                Data início
              </label>
              <input
                id="startDate"
                type="date"
                className={inputClassName}
                {...register('startDate')}
              />
              {errors.startDate && <p className={errorClassName}>{errors.startDate.message}</p>}
            </div>
            <div>
              <label htmlFor="endDate" className={labelClassName}>
                Data fim
              </label>
              <input id="endDate" type="date" className={inputClassName} {...register('endDate')} />
              {errors.endDate && <p className={errorClassName}>{errors.endDate.message}</p>}
            </div>
          </div>

          {!withFunnel && (
            <div>
              <label htmlFor="targetValue" className={labelClassName}>
                Valor da meta
              </label>
              <input
                id="targetValue"
                type="number"
                min="0"
                step={type === 'vgv' ? '1000' : '1'}
                placeholder={type === 'vgv' ? '5000000' : '50'}
                className={inputClassName}
                {...register('targetValue')}
              />
              {errors.targetValue && <p className={errorClassName}>{errors.targetValue.message}</p>}
            </div>
          )}

          {withFunnel && (
            <div className="space-y-4 rounded-[12px] border-[0.5px] border-neutral-200 p-4">
              <p className="text-[13px] font-medium text-neutral-900">Funil individual</p>

              <div>
                <label htmlFor="individualVgv" className={labelClassName}>
                  VGV desejado
                </label>
                <input
                  id="individualVgv"
                  type="number"
                  min="0"
                  step="1000"
                  placeholder="800000"
                  className={inputClassName}
                  {...register('individualVgv')}
                />
                {errors.individualVgv && (
                  <p className={errorClassName}>{errors.individualVgv.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="individualTicket" className={labelClassName}>
                  Ticket médio das unidades
                </label>
                <input
                  id="individualTicket"
                  type="number"
                  min="0"
                  step="1000"
                  placeholder="400000"
                  className={inputClassName}
                  {...register('individualTicket')}
                />
                {errors.individualTicket && (
                  <p className={errorClassName}>{errors.individualTicket.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="individualCommissionPct" className={labelClassName}>
                  % de comissão
                </label>
                <input
                  id="individualCommissionPct"
                  type="number"
                  min="0"
                  step="0.5"
                  placeholder="3"
                  className={inputClassName}
                  {...register('individualCommissionPct')}
                />
                {errors.individualCommissionPct && (
                  <p className={errorClassName}>{errors.individualCommissionPct.message}</p>
                )}
              </div>

              <details open={errors.rates ? true : undefined} className="rounded-[12px] bg-neutral-100 p-3">
                <summary className="cursor-pointer text-[13px] font-medium text-neutral-900">
                  Taxas de conversão (avançado)
                </summary>
                <div className="mt-3 space-y-3">
                  {CONVERSION_RATE_FIELDS.map(({ key, label }) => (
                    <div key={key}>
                      <label htmlFor={key} className="mb-1 block text-xs text-neutral-600">
                        {label}
                      </label>
                      <input
                        id={key}
                        type="number"
                        min="0"
                        step="0.1"
                        inputMode="decimal"
                        className={inputClassName}
                        {...register(`rates.${key}`)}
                      />
                      {errors.rates?.[key] && <p className={errorClassName}>{errors.rates[key]?.message}</p>}
                    </div>
                  ))}
                </div>
              </details>

              {funnelPreview && (
                <div className="rounded-[12px] bg-neutral-100 p-3">
                  <p className="text-xs font-medium text-neutral-600">
                    Funil calculado automaticamente
                  </p>
                  <div className="mt-2 grid grid-cols-3 gap-2 text-center sm:grid-cols-6">
                    {FUNNEL_STAGES.map((stage) => (
                      <div key={stage.key}>
                        <p className="text-sm font-semibold text-neutral-900">
                          {Math.ceil(funnelPreview.stages[stage.key])}
                        </p>
                        <p className="text-[10px] text-neutral-400">{stage.label}</p>
                      </div>
                    ))}
                  </div>
                  <div className="mt-3 flex items-center justify-between text-xs text-neutral-600">
                    <span>
                      Unidades: <strong>{Math.ceil(funnelPreview.units)}</strong>
                    </span>
                    <span>
                      Comissão: <strong>{formatCurrency(funnelPreview.commission)}</strong>
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}
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
            disabled={isSubmitting || saveGoal.isPending}
            className="flex-1 rounded-[8px] bg-brand px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-70"
          >
            Salvar
          </button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
