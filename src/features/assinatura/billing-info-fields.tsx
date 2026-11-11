'use client'

import type { FactoryOpts } from 'imask'
import type { Control, FieldErrors, Path, UseFormRegister } from 'react-hook-form'
import { z } from 'zod'
import { FormField, inputClassName } from '@/features/equipe/field'
import { MaskedInput } from '@/features/equipe/masked-input'
import { profilePhoneMask } from '@/features/perfil/rules'
import { isValidDocumentOrEmpty } from './constants'

export const documentMask: FactoryOpts = {
  mask: [{ mask: '000.000.000-00' }, { mask: '00.000.000/0000-00' }],
}

export const billingInfoShape = {
  billingName: z.string().trim().max(160, 'Muito longo'),
  billingDocument: z.string().refine(isValidDocumentOrEmpty, 'CPF ou CNPJ inválido'),
  billingEmail: z.union([z.literal(''), z.string().trim().email('E-mail inválido')]),
  billingPhone: z
    .string()
    .refine((value) => [0, 10, 11].includes(value.replace(/\D/g, '').length), 'Telefone com DDD: 10 ou 11 dígitos'),
}

export const billingInfoSchema = z.object(billingInfoShape)

export type BillingInfoValues = z.infer<typeof billingInfoSchema>

/** Campos de cobrança, usados na /assinatura e no painel /admin (formulários que contêm esses quatro campos) */
export function BillingInfoFields<T extends BillingInfoValues>({
  register,
  control,
  errors: allErrors,
  idPrefix,
}: {
  register: UseFormRegister<T>
  control: Control<T>
  errors: FieldErrors<T>
  idPrefix: string
}) {
  // T contém os quatro campos (restrição acima)
  const field = (name: keyof BillingInfoValues) => name as Path<T>
  const errors = allErrors as FieldErrors<BillingInfoValues>
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <FormField label="Nome ou razão social" htmlFor={`${idPrefix}-name`} error={errors.billingName?.message}>
        <input id={`${idPrefix}-name`} className={inputClassName} {...register(field('billingName'))} />
      </FormField>
      <FormField label="CPF ou CNPJ" htmlFor={`${idPrefix}-document`} error={errors.billingDocument?.message}>
        <MaskedInput control={control} name={field('billingDocument')} mask={documentMask} id={`${idPrefix}-document`} />
      </FormField>
      <FormField label="E-mail de cobrança" htmlFor={`${idPrefix}-email`} error={errors.billingEmail?.message}>
        <input id={`${idPrefix}-email`} type="email" className={inputClassName} {...register(field('billingEmail'))} />
      </FormField>
      <FormField label="Telefone de cobrança" htmlFor={`${idPrefix}-phone`} error={errors.billingPhone?.message}>
        <MaskedInput
          control={control}
          name={field('billingPhone')}
          mask={profilePhoneMask}
          id={`${idPrefix}-phone`}
          placeholder="(00) 00000-0000"
        />
      </FormField>
    </div>
  )
}
