'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import type { ChecklistItem, DocumentCategory, DocumentHolder } from '@/types'
import { DOCUMENT_CATEGORIES, DOCUMENT_HOLDERS, MAX_ITEM_NAME_LENGTH } from '../constants'

const itemSchema = z.object({
  name: z.string().trim().min(1, 'Informe o nome').max(MAX_ITEM_NAME_LENGTH, `Use no máximo ${MAX_ITEM_NAME_LENGTH} caracteres`),
  description: z.string().trim().max(500, 'Use no máximo 500 caracteres'),
  category: z.enum(DOCUMENT_CATEGORIES.map((item) => item.value) as [DocumentCategory, ...DocumentCategory[]]),
  holder: z.enum(DOCUMENT_HOLDERS.map((item) => item.value) as [DocumentHolder, ...DocumentHolder[]]),
  required: z.boolean(),
})

export type ChecklistItemFormData = z.infer<typeof itemSchema>

const inputClassName =
  'mt-1.5 w-full rounded-[12px] border-[1.5px] border-neutral-200 bg-white px-3 py-2.5 text-base text-neutral-900 outline-none transition-colors focus:border-brand'
const labelClassName = 'text-[13px] font-medium text-neutral-900'

// Novo documento avulso ou renomear um avulso (só o nome muda)
export function ChecklistItemDialog({
  open,
  onOpenChange,
  item,
  isSubmitting,
  onSubmit,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  item: ChecklistItem | null
  isSubmitting: boolean
  onSubmit: (data: ChecklistItemFormData) => void
}) {
  const isRename = item !== null
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ChecklistItemFormData>({
    resolver: zodResolver(itemSchema),
    defaultValues: {
      name: item?.name ?? '',
      description: item?.description ?? '',
      category: item?.category ?? 'outro',
      holder: item?.holder ?? 'titular',
      required: item?.required ?? true,
    },
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto rounded-2xl border-[0.5px] border-neutral-200 bg-white ring-0 sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isRename ? 'Renomear documento' : 'Adicionar documento'}</DialogTitle>
          {!isRename && <p className="text-sm text-neutral-400">Vale só para este cliente.</p>}
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} noValidate className="min-w-0 space-y-4">
          <div>
            <label htmlFor="item-name" className={labelClassName}>
              Nome
            </label>
            <input id="item-name" className={inputClassName} {...register('name')} />
            {errors.name && <p className="mt-1 text-[12px] text-danger">{errors.name.message}</p>}
          </div>

          {!isRename && (
            <>
              <div>
                <label htmlFor="item-description" className={labelClassName}>
                  Descrição <span className="font-normal text-neutral-400">(opcional)</span>
                </label>
                <input id="item-description" className={inputClassName} {...register('description')} />
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="item-category" className={labelClassName}>
                    Categoria
                  </label>
                  <select id="item-category" className={inputClassName} {...register('category')}>
                    {DOCUMENT_CATEGORIES.map((category) => (
                      <option key={category.value} value={category.value}>
                        {category.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="item-holder" className={labelClassName}>
                    De quem
                  </label>
                  <select id="item-holder" className={inputClassName} {...register('holder')}>
                    {DOCUMENT_HOLDERS.map((holder) => (
                      <option key={holder.value} value={holder.value}>
                        {holder.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <label className="flex min-h-11 items-center gap-2.5 text-sm text-neutral-900">
                <input type="checkbox" className="h-4 w-4 accent-brand" {...register('required')} />
                Obrigatório
              </label>
            </>
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
              disabled={isSubmitting}
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
