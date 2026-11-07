'use client'

import { useRef } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { isAxiosError } from 'axios'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { toast } from '@/components/ui/toast'
import { messageTemplatesService } from '@/services/message-templates.service'
import { useAuthStore } from '@/store/auth.store'
import type { MessageTemplate, MessageTemplateType } from '@/types'
import {
  MAX_TEMPLATE_LENGTH,
  TEMPLATE_TYPES,
  TEMPLATE_VARIABLES,
  canShareTemplates,
  renderSample,
} from '../constants'

const templateSchema = z.object({
  name: z.string().trim().min(1, 'Informe o nome').max(80, 'Use no máximo 80 caracteres'),
  type: z.enum(TEMPLATE_TYPES.map((type) => type.value) as [MessageTemplateType, ...MessageTemplateType[]]),
  content: z
    .string()
    .trim()
    .min(1, 'Escreva o texto do modelo')
    .max(MAX_TEMPLATE_LENGTH, `Use no máximo ${MAX_TEMPLATE_LENGTH} caracteres`),
  isPublic: z.boolean(),
})

type TemplateFormData = z.infer<typeof templateSchema>

const inputClassName =
  'mt-1.5 w-full rounded-[12px] border-[1.5px] border-neutral-200 bg-white px-3 py-2.5 text-base text-neutral-900 outline-none transition-colors focus:border-brand'
const labelClassName = 'text-[13px] font-medium text-neutral-900'
const errorClassName = 'mt-1 text-[12px] text-danger'

export function TemplateFormDialog({
  open,
  onOpenChange,
  template,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  template: MessageTemplate | null
}) {
  const queryClient = useQueryClient()
  const user = useAuthStore((state) => state.user)
  const textareaRef = useRef<HTMLTextAreaElement | null>(null)

  const {
    register,
    handleSubmit,
    control,
    getValues,
    setValue,
    formState: { errors },
  } = useForm<TemplateFormData>({
    resolver: zodResolver(templateSchema),
    defaultValues: {
      name: template?.name ?? '',
      type: template?.type ?? 'outro',
      content: template?.content ?? '',
      isPublic: template?.isPublic ?? false,
    },
  })
  const content = useWatch({ control, name: 'content' })
  const { ref: registerContent, ...contentField } = register('content')

  const save = useMutation({
    mutationFn: (data: TemplateFormData) =>
      template ? messageTemplatesService.update(template.id, data) : messageTemplatesService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['message-templates'] })
      toast.add({ title: template ? 'Modelo atualizado' : 'Modelo criado', type: 'success' })
      onOpenChange(false)
    },
    onError: (error) => {
      const message = isAxiosError(error) ? error.response?.data?.message : undefined
      toast.add({
        title: 'Não foi possível salvar o modelo',
        description: typeof message === 'string' ? message : undefined,
        type: 'error',
      })
    },
  })

  function insertVariable(key: string) {
    const textarea = textareaRef.current
    const current = getValues('content')
    const start = textarea?.selectionStart ?? current.length
    const end = textarea?.selectionEnd ?? current.length
    const variable = `{{${key}}}`

    setValue('content', `${current.slice(0, start)}${variable}${current.slice(end)}`, {
      shouldDirty: true,
      shouldValidate: true,
    })
    // O React reescreve o valor no próximo frame e o cursor iria para o fim
    requestAnimationFrame(() => {
      textarea?.focus()
      textarea?.setSelectionRange(start + variable.length, start + variable.length)
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto rounded-2xl border-[0.5px] border-neutral-200 bg-white ring-0 sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{template ? 'Editar modelo' : 'Novo modelo'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit((data) => save.mutate(data))} noValidate className="min-w-0 space-y-4">
          <div>
            <label htmlFor="template-name" className={labelClassName}>
              Nome
            </label>
            <input id="template-name" className={inputClassName} {...register('name')} />
            {errors.name && <p className={errorClassName}>{errors.name.message}</p>}
          </div>

          <div>
            <label htmlFor="template-type" className={labelClassName}>
              Tipo
            </label>
            <select id="template-type" className={inputClassName} {...register('type')}>
              {TEMPLATE_TYPES.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <div className="flex items-center justify-between">
              <label htmlFor="template-content" className={labelClassName}>
                Texto
              </label>
              <span
                className={`text-xs ${content.length > MAX_TEMPLATE_LENGTH ? 'text-danger' : 'text-neutral-400'}`}
              >
                {content.length}/{MAX_TEMPLATE_LENGTH}
              </span>
            </div>
            <textarea
              id="template-content"
              rows={5}
              className={`${inputClassName} resize-none`}
              {...contentField}
              ref={(element) => {
                registerContent(element)
                textareaRef.current = element
              }}
            />
            {errors.content && <p className={errorClassName}>{errors.content.message}</p>}
            <div className="mt-2 flex flex-wrap gap-1.5">
              {TEMPLATE_VARIABLES.map((variable) => (
                <button
                  key={variable.key}
                  type="button"
                  onClick={() => insertVariable(variable.key)}
                  className="min-h-9 rounded-full border-[1.5px] border-neutral-200 px-2.5 text-xs font-medium text-neutral-600 transition-colors hover:border-brand hover:text-brand"
                >
                  {`{{${variable.key}}}`}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className={labelClassName}>Prévia</p>
            <p className="mt-1.5 min-h-16 whitespace-pre-wrap break-words rounded-[12px] bg-neutral-100 p-3 text-sm text-neutral-600">
              {content ? renderSample(content) : 'Escreva o texto para ver a prévia.'}
            </p>
          </div>

          {canShareTemplates(user) && (
            <label className="flex min-h-11 items-center gap-2.5 text-sm text-neutral-900">
              <input type="checkbox" className="h-4 w-4 accent-brand" {...register('isPublic')} />
              Compartilhar com toda a imobiliária
            </label>
          )}

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
