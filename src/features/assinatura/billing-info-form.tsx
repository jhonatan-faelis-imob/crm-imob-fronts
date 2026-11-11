'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { toast } from '@/components/ui/toast'
import { apiErrorMessage } from '@/features/equipe/api'
import { billingService, type BillingInfo } from '@/services/billing.service'
import { BillingInfoFields, billingInfoSchema, type BillingInfoValues } from './billing-info-fields'
import { formatDocument } from './constants'
import { BILLING_ME_KEY } from './use-billing-me'

export function billingInfoValues(info: BillingInfo | null): BillingInfoValues {
  return {
    billingName: info?.billingName ?? '',
    billingDocument: formatDocument(info?.billingDocument),
    billingEmail: info?.billingEmail ?? '',
    billingPhone: info?.billingPhone ?? '',
  }
}

/** Dados de cobrança da própria imobiliária (diretor) */
export function BillingInfoForm({
  info,
  onSaved,
  submitLabel = 'Salvar dados de cobrança',
}: {
  info: BillingInfo | null
  /** Depois de salvar (ex.: seguir para a assinatura) */
  onSaved?: (saved: BillingInfo) => void
  submitLabel?: string
}) {
  const queryClient = useQueryClient()
  const {
    register,
    control,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isDirty },
  } = useForm<BillingInfoValues>({ resolver: zodResolver(billingInfoSchema), defaultValues: billingInfoValues(info) })

  const save = useMutation({
    mutationFn: billingService.updateBillingInfo,
    onSuccess: (saved) => {
      reset(billingInfoValues(saved))
      queryClient.invalidateQueries({ queryKey: BILLING_ME_KEY })
      toast.add({ title: 'Dados de cobrança salvos', type: 'success' })
      onSaved?.(saved)
    },
    onError: (error) => setError('root', { message: apiErrorMessage(error, 'Não foi possível salvar. Tente de novo.') }),
  })

  return (
    <form onSubmit={handleSubmit((values) => save.mutate(values))} noValidate className="space-y-4">
      <BillingInfoFields register={register} control={control} errors={errors} idPrefix="billing" />
      {errors.root?.message && (
        <p role="alert" className="rounded-[12px] bg-danger/10 px-3 py-2 text-sm text-danger">
          {errors.root.message}
        </p>
      )}
      <div className="flex justify-end">
        <button
          type="submit"
          disabled={(!isDirty && !onSaved) || save.isPending}
          className="min-h-11 w-full rounded-[8px] bg-brand px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-brand-dark disabled:opacity-60 sm:w-auto"
        >
          {save.isPending ? 'Salvando...' : submitLabel}
        </button>
      </div>
    </form>
  )
}
