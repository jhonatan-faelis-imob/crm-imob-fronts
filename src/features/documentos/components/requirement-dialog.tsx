'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { isAxiosError } from 'axios'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { toast } from '@/components/ui/toast'
import { documentsService } from '@/services/documents.service'
import type { DocumentAppliesWhen, DocumentCategory, DocumentHolder, DocumentRequirement } from '@/types'
import { APPLIES_WHEN_OPTIONS, DOCUMENT_CATEGORIES, DOCUMENT_HOLDERS, MAX_ITEM_NAME_LENGTH } from '../constants'

const requirementSchema = z.object({
  name: z.string().trim().min(1, 'Informe o nome').max(MAX_ITEM_NAME_LENGTH, `Use no máximo ${MAX_ITEM_NAME_LENGTH} caracteres`),
  description: z.string().trim().max(500, 'Use no máximo 500 caracteres'),
  category: z.enum(DOCUMENT_CATEGORIES.map((item) => item.value) as [DocumentCategory, ...DocumentCategory[]]),
  holder: z.enum(DOCUMENT_HOLDERS.map((item) => item.value) as [DocumentHolder, ...DocumentHolder[]]),
  required: z.boolean(),
  appliesWhen: z.enum(APPLIES_WHEN_OPTIONS.map((item) => item.value) as [DocumentAppliesWhen, ...DocumentAppliesWhen[]]),
  active: z.boolean(),
})

type RequirementFormData = z.infer<typeof requirementSchema>

const inputClassName =
  'mt-1.5 w-full rounded-[12px] border-[1.5px] border-neutral-200 bg-white px-3 py-2.5 text-base text-neutral-900 outline-none transition-colors focus:border-brand'
const labelClassName = 'text-[13px] font-medium text-neutral-900'

export function RequirementDialog({
  open,
  onOpenChange,
  requirement,
  defaultHolder,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  requirement: DocumentRequirement | null
  defaultHolder: DocumentHolder
}) {
  const queryClient = useQueryClient()
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RequirementFormData>({
    resolver: zodResolver(requirementSchema),
    defaultValues: {
      name: requirement?.name ?? '',
      description: requirement?.description ?? '',
      category: requirement?.category ?? 'pessoal',
      holder: requirement?.holder ?? defaultHolder,
      required: requirement?.required ?? true,
      appliesWhen: requirement?.appliesWhen ?? 'always',
      active: requirement?.active ?? true,
    },
  })

  const save = useMutation({
    mutationFn: (data: RequirementFormData) =>
      requirement ? documentsService.updateRequirement(requirement.id, data) : documentsService.createRequirement(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['document-requirements'] })
      toast.add({ title: requirement ? 'Documento atualizado' : 'Documento adicionado', type: 'success' })
      onOpenChange(false)
    },
    onError: (error) => {
      const message = isAxiosError(error) ? error.response?.data?.message : undefined
      toast.add({
        title: 'Não foi possível salvar',
        description: typeof message === 'string' ? message : undefined,
        type: 'error',
      })
    },
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto rounded-2xl border-[0.5px] border-neutral-200 bg-white ring-0 sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{requirement ? 'Editar documento' : 'Novo documento'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit((data) => save.mutate(data))} noValidate className="min-w-0 space-y-4">
          <div>
            <label htmlFor="req-name" className={labelClassName}>
              Nome
            </label>
            <input id="req-name" className={inputClassName} {...register('name')} />
            {errors.name && <p className="mt-1 text-[12px] text-danger">{errors.name.message}</p>}
          </div>
          <div>
            <label htmlFor="req-description" className={labelClassName}>
              Descrição <span className="font-normal text-neutral-400">(opcional)</span>
            </label>
            <textarea id="req-description" rows={2} className={`${inputClassName} resize-none`} {...register('description')} />
            {errors.description && <p className="mt-1 text-[12px] text-danger">{errors.description.message}</p>}
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="req-category" className={labelClassName}>
                Categoria
              </label>
              <select id="req-category" className={inputClassName} {...register('category')}>
                {DOCUMENT_CATEGORIES.map((category) => (
                  <option key={category.value} value={category.value}>
                    {category.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="req-holder" className={labelClassName}>
                De quem
              </label>
              <select id="req-holder" className={inputClassName} {...register('holder')}>
                {DOCUMENT_HOLDERS.map((holder) => (
                  <option key={holder.value} value={holder.value}>
                    {holder.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="sm:col-span-2">
              <label htmlFor="req-applies" className={labelClassName}>
                Quando se aplica
              </label>
              <select id="req-applies" className={inputClassName} {...register('appliesWhen')}>
                {APPLIES_WHEN_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex flex-col gap-1 sm:flex-row sm:gap-6">
            <label className="flex min-h-11 items-center gap-2.5 text-sm text-neutral-900">
              <input type="checkbox" className="h-4 w-4 accent-brand" {...register('required')} />
              Obrigatório
            </label>
            <label className="flex min-h-11 items-center gap-2.5 text-sm text-neutral-900">
              <input type="checkbox" className="h-4 w-4 accent-brand" {...register('active')} />
              Ativo
            </label>
          </div>

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
              className="h-11 rounded-[8px] bg-brand px-4 text-sm font-medium text-white transition-colors hover:bg-brand-dark disabled:opacity-70 sm:h-10"
            >
              Salvar
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
