'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { isAxiosError } from 'axios'
import { useForm, useWatch } from 'react-hook-form'
import { z } from 'zod'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { toast } from '@/components/ui/toast'
import { PRIORITY_META, TASK_PRIORITIES, TASK_TYPES, TASK_TYPE_META } from '@/features/tarefas/constants'
import { cadencesService } from '@/services/cadences.service'
import type { CadenceStage, CadenceStep, TaskPriority, TaskType } from '@/types'
import { MAX_STEP_TITLE_LENGTH, previewDueDate } from '../constants'
import { invalidateCadenceQueries } from '../invalidate-cadence-queries'

const stepSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, 'Informe o título')
    .max(MAX_STEP_TITLE_LENGTH, `Use no máximo ${MAX_STEP_TITLE_LENGTH} caracteres`),
  type: z.enum(TASK_TYPES as [TaskType, ...TaskType[]]),
  priority: z.enum(TASK_PRIORITIES as [TaskPriority, ...TaskPriority[]]),
  offsetDays: z
    .number({ invalid_type_error: 'Informe os dias' })
    .int('Use um número inteiro')
    .min(0, 'Mínimo de 0 dias')
    .max(365, 'Máximo de 365 dias'),
  dueTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Informe o horário'),
  skipWeekends: z.boolean(),
  description: z.string().trim().max(1000, 'Use no máximo 1000 caracteres'),
})

type StepFormData = z.infer<typeof stepSchema>

const inputClassName =
  'mt-1.5 w-full rounded-[12px] border-[1.5px] border-neutral-200 bg-white px-3 py-2.5 text-base text-neutral-900 outline-none transition-colors focus:border-brand'
const labelClassName = 'text-[13px] font-medium text-neutral-900'
const errorClassName = 'mt-1 text-[12px] text-danger'

export function CadenceStepDialog({
  open,
  onOpenChange,
  stage,
  step,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  stage: CadenceStage | null
  step: CadenceStep | null
}) {
  const queryClient = useQueryClient()

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<StepFormData>({
    resolver: zodResolver(stepSchema),
    defaultValues: {
      title: step?.title ?? '',
      type: step?.type ?? 'ligacao',
      priority: step?.priority ?? 'media',
      offsetDays: step?.offsetDays ?? 1,
      dueTime: step?.dueTime ?? '09:00',
      skipWeekends: step?.skipWeekends ?? false,
      description: step?.description ?? '',
    },
  })

  const [offsetDays, dueTime, skipWeekends] = useWatch({ control, name: ['offsetDays', 'dueTime', 'skipWeekends'] })
  const canPreview = Number.isInteger(offsetDays) && offsetDays >= 0 && offsetDays <= 365 && /^\d{2}:\d{2}$/.test(dueTime)

  const save = useMutation({
    mutationFn: (data: StepFormData) => {
      if (step) return cadencesService.updateStep(step.id, data)
      if (!stage) throw new Error('Etapa não selecionada')
      return cadencesService.createStep({ ...data, funnelStageId: stage.id })
    },
    onSuccess: () => {
      invalidateCadenceQueries(queryClient)
      toast.add({ title: step ? 'Passo atualizado' : 'Passo adicionado', type: 'success' })
      onOpenChange(false)
    },
    onError: (error) => {
      const message = isAxiosError(error) ? error.response?.data?.message : undefined
      toast.add({
        title: 'Não foi possível salvar o passo',
        description: typeof message === 'string' ? message : undefined,
        type: 'error',
      })
    },
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto rounded-2xl border-[0.5px] border-neutral-200 bg-white ring-0 sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{step ? 'Editar passo' : 'Adicionar passo'}</DialogTitle>
          {stage && <p className="text-sm text-neutral-400">Etapa {stage.name}</p>}
        </DialogHeader>

        <form onSubmit={handleSubmit((data) => save.mutate(data))} noValidate className="min-w-0 space-y-4">
          <div>
            <label htmlFor="step-title" className={labelClassName}>
              Título
            </label>
            <input id="step-title" className={inputClassName} {...register('title')} />
            <p className="mt-1 text-[12px] text-neutral-400">
              Use {'{{nome}}'} ou {'{{primeiro_nome}}'} para o nome do lead.
            </p>
            {errors.title && <p className={errorClassName}>{errors.title.message}</p>}
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="step-type" className={labelClassName}>
                Tipo
              </label>
              <select id="step-type" className={inputClassName} {...register('type')}>
                {TASK_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {TASK_TYPE_META[type].label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="step-priority" className={labelClassName}>
                Prioridade
              </label>
              <select id="step-priority" className={inputClassName} {...register('priority')}>
                {TASK_PRIORITIES.map((priority) => (
                  <option key={priority} value={priority}>
                    {PRIORITY_META[priority].label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="step-offset" className={labelClassName}>
                Quantos dias depois
              </label>
              <input
                id="step-offset"
                type="number"
                inputMode="numeric"
                min={0}
                max={365}
                className={inputClassName}
                {...register('offsetDays', { valueAsNumber: true })}
              />
              {errors.offsetDays && <p className={errorClassName}>{errors.offsetDays.message}</p>}
            </div>
            <div>
              <label htmlFor="step-time" className={labelClassName}>
                Horário
              </label>
              <input id="step-time" type="time" className={inputClassName} {...register('dueTime')} />
              {errors.dueTime && <p className={errorClassName}>{errors.dueTime.message}</p>}
            </div>
          </div>

          <label className="flex min-h-11 items-center gap-2.5 text-sm text-neutral-900">
            <input type="checkbox" className="h-4 w-4 accent-brand" {...register('skipWeekends')} />
            Pular fins de semana
          </label>

          <div>
            <label htmlFor="step-description" className={labelClassName}>
              Descrição <span className="font-normal text-neutral-400">(opcional)</span>
            </label>
            <textarea id="step-description" rows={3} className={`${inputClassName} resize-none`} {...register('description')} />
            {errors.description && <p className={errorClassName}>{errors.description.message}</p>}
          </div>

          <p className="rounded-[12px] bg-neutral-100 p-3 text-sm text-neutral-600">
            {canPreview
              ? `Se o lead entrar hoje, a tarefa vence em ${previewDueDate({ offsetDays, dueTime, skipWeekends })}.`
              : 'Preencha os dias e o horário para ver quando a tarefa vence.'}
          </p>

          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="h-11 rounded-[8px] border-[1.5px] border-neutral-200 px-4 text-sm font-medium text-neutral-600 hover:bg-neutral-100 sm:h-10"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={save.isPending}
              className="h-11 rounded-[8px] bg-brand px-4 text-sm font-medium text-white transition-colors hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-70 sm:h-10"
            >
              Salvar
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
