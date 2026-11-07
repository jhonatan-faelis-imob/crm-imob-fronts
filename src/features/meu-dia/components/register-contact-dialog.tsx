'use client'

import { useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { addDays, parseLocalISODate, toLocalISODate } from '@/lib/date'
import type { TaskType } from '@/types'
import { ResponsiveModal } from './responsive-modal'

const CONTACT_TYPES = [
  { value: 'ligacao', label: 'Ligação' },
  { value: 'whatsapp', label: 'WhatsApp' },
  { value: 'visita', label: 'Visita' },
  { value: 'email', label: 'E-mail' },
] as const

const contactSchema = z
  .object({
    type: z.enum(['ligacao', 'whatsapp', 'visita', 'email']),
    notes: z.string().trim().min(1, 'Conte o que foi tratado'),
    scheduleNext: z.boolean(),
    nextTitle: z.string().trim(),
    nextDate: z.string(),
  })
  .superRefine((data, context) => {
    if (!data.scheduleNext) return
    if (!data.nextTitle) {
      context.addIssue({ code: 'custom', path: ['nextTitle'], message: 'Informe o título da tarefa' })
    }
    if (!data.nextDate || data.nextDate < toLocalISODate()) {
      context.addIssue({ code: 'custom', path: ['nextDate'], message: 'Escolha hoje ou uma data futura' })
    }
  })

type ContactFormData = z.infer<typeof contactSchema>

export interface ContactFormResult {
  type: TaskType
  notes: string
  nextTask?: { title: string; dueDate: Date }
}

const inputClassName =
  'mt-1.5 w-full rounded-[12px] border-[1.5px] border-neutral-200 bg-white px-3 py-2.5 text-base text-neutral-900 outline-none transition-colors focus:border-brand'
const labelClassName = 'text-[13px] font-medium text-neutral-900'
const errorClassName = 'mt-1 text-[12px] text-danger'

function dueDateFor(day: string) {
  const date = parseLocalISODate(day)
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 9, 0)
}

export function RegisterContactDialog({
  open,
  onOpenChange,
  leadName,
  isSaving,
  onSave,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  leadName: string
  isSaving: boolean
  onSave: (result: ContactFormResult) => void
}) {
  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<ContactFormData>({
    resolver: zodResolver(contactSchema),
    defaultValues: {
      type: 'ligacao',
      notes: '',
      scheduleNext: false,
      nextTitle: `Retornar contato: ${leadName}`,
      nextDate: addDays(toLocalISODate(), 3),
    },
  })
  const scheduleNext = useWatch({ control, name: 'scheduleNext' })

  function submit(data: ContactFormData) {
    onSave({
      type: data.type,
      notes: data.notes,
      nextTask: data.scheduleNext ? { title: data.nextTitle, dueDate: dueDateFor(data.nextDate) } : undefined,
    })
  }

  return (
    <ResponsiveModal open={open} onOpenChange={onOpenChange} title="Registrar contato">
      <form onSubmit={handleSubmit(submit)} noValidate className="min-w-0 space-y-4">
        <p className="truncate text-sm text-neutral-400">{leadName}</p>

        <div>
          <label htmlFor="contact-type" className={labelClassName}>
            Tipo
          </label>
          <select id="contact-type" className={inputClassName} {...register('type')}>
            {CONTACT_TYPES.map((type) => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="contact-notes" className={labelClassName}>
            O que foi tratado
          </label>
          <textarea id="contact-notes" rows={3} className={`${inputClassName} resize-none`} {...register('notes')} />
          {errors.notes && <p className={errorClassName}>{errors.notes.message}</p>}
        </div>

        <label className="flex min-h-11 items-center gap-2.5 text-sm text-neutral-900">
          <input type="checkbox" className="h-4 w-4 accent-brand" {...register('scheduleNext')} />
          Agendar próxima tarefa
        </label>

        {scheduleNext && (
          <div className="space-y-4">
            <div>
              <label htmlFor="contact-next-title" className={labelClassName}>
                Título da tarefa
              </label>
              <input id="contact-next-title" className={inputClassName} {...register('nextTitle')} />
              {errors.nextTitle && <p className={errorClassName}>{errors.nextTitle.message}</p>}
            </div>
            <div>
              <label htmlFor="contact-next-date" className={labelClassName}>
                Data
              </label>
              <input
                id="contact-next-date"
                type="date"
                min={toLocalISODate()}
                className={inputClassName}
                {...register('nextDate')}
              />
              {errors.nextDate && <p className={errorClassName}>{errors.nextDate.message}</p>}
            </div>
          </div>
        )}

        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="h-11 rounded-[8px] border-[1.5px] border-neutral-200 px-4 text-sm font-medium text-neutral-600 hover:bg-neutral-100"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={isSaving}
            className="h-11 rounded-[8px] bg-brand px-4 text-sm font-medium text-white transition-colors hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-70"
          >
            Salvar contato
          </button>
        </div>
      </form>
    </ResponsiveModal>
  )
}
