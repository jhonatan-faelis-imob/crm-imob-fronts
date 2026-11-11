'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { z } from 'zod'
import { TemporaryPasswordBox } from '@/components/temporary-password-box'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { toast } from '@/components/ui/toast'
import { BillingInfoFields, billingInfoShape } from '@/features/assinatura/billing-info-fields'
import { formatMoney, STATUS_META, SUBSCRIPTION_STATUSES } from '@/features/assinatura/constants'
import { apiErrorMessage } from '@/features/equipe/api'
import { FormField, inputClassName, labelClassName } from '@/features/equipe/field'
import { slugify, SLUG_PATTERN } from '@/lib/slugify'
import { adminService, type CreatedOrganization, type NewOrganizationInput } from '@/services/admin.service'
import type { SubscriptionStatus } from '@/services/billing.service'
import { isValidSeats, parseMoney, suggestedPrice } from './rules'
import { invalidateAdmin, usePlans } from './use-admin'

const schema = z
  .object({
    name: z.string().trim().min(1, 'Informe o nome').max(120),
    slug: z.string().regex(SLUG_PATTERN, 'Só letras minúsculas, números e hífen'),
    plan: z.string().min(1, 'Escolha o plano'),
    seats: z.string().refine(isValidSeats, 'Entre 1 e 1000'),
    subscriptionStatus: z.enum(['teste', 'ativa', 'atrasada', 'bloqueada', 'cancelada']),
    trialEndsAt: z.string(),
    currentPeriodEnd: z.string(),
    monthlyPrice: z.string().refine((value) => value.trim() === '' || parseMoney(value) !== null, 'Valor inválido'),
    notes: z.string().max(5000),
    directorName: z.string().trim().min(1, 'Informe o nome do diretor').max(120),
    directorEmail: z.string().trim().email('E-mail inválido'),
    directorPassword: z.string().refine((value) => value === '' || value.length >= 8, 'Mínimo de 8 caracteres'),
    ...billingInfoShape,
  })

type FormValues = z.infer<typeof schema>

const emptyToUndefined = (value: string) => (value.trim() === '' ? undefined : value.trim())

function toInput(values: FormValues): NewOrganizationInput {
  return {
    name: values.name,
    slug: values.slug,
    plan: values.plan,
    seats: Number(values.seats),
    subscriptionStatus: values.subscriptionStatus,
    trialEndsAt: emptyToUndefined(values.trialEndsAt),
    currentPeriodEnd: emptyToUndefined(values.currentPeriodEnd),
    monthlyPrice: parseMoney(values.monthlyPrice) ?? undefined,
    notes: emptyToUndefined(values.notes),
    directorName: values.directorName,
    directorEmail: values.directorEmail,
    directorPassword: emptyToUndefined(values.directorPassword),
    billingName: emptyToUndefined(values.billingName),
    billingDocument: emptyToUndefined(values.billingDocument),
    billingEmail: emptyToUndefined(values.billingEmail),
    billingPhone: emptyToUndefined(values.billingPhone),
  }
}

function SectionTitle({ children }: { children: string }) {
  return <h3 className="pt-2 text-[13px] font-semibold uppercase tracking-wide text-neutral-400">{children}</h3>
}

function NewOrganizationForm({ onCancel, onCreated }: { onCancel: () => void; onCreated: (result: CreatedOrganization) => void }) {
  const queryClient = useQueryClient()
  const { data: plans } = usePlans()
  const [slugTouched, setSlugTouched] = useState(false)
  const {
    register,
    control,
    handleSubmit,
    setValue,
    setError,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: '', slug: '', plan: 'equipe', seats: '5', subscriptionStatus: 'teste', trialEndsAt: '', currentPeriodEnd: '',
      monthlyPrice: '', notes: '', directorName: '', directorEmail: '', directorPassword: '',
      billingName: '', billingDocument: '', billingEmail: '', billingPhone: '',
    },
  })
  const [plan, seats, status] = useWatch({ control, name: ['plan', 'seats', 'subscriptionStatus'] })
  const tablePrice = suggestedPrice(plans, plan, Number(seats) || 0)

  const create = useMutation({
    mutationFn: adminService.create,
    onSuccess: (result) => {
      invalidateAdmin(queryClient)
      onCreated(result)
    },
    onError: (error) => {
      const message = apiErrorMessage(error, 'Não foi possível criar a imobiliária.')
      if (/slug/i.test(message)) setError('slug', { message })
      else if (/diretor|e-mail/i.test(message)) setError('directorEmail', { message })
      else if (/cpf|cnpj/i.test(message)) setError('billingDocument', { message })
      else setError('root', { message })
    },
  })

  return (
    <>
      <form
        onSubmit={handleSubmit((values) => create.mutate(toInput(values)))}
        noValidate
        className="flex-1 space-y-4 overflow-y-auto p-4 sm:p-6"
      >
        <SectionTitle>Imobiliária</SectionTitle>
        <FormField label="Nome" htmlFor="org-name" required error={errors.name?.message}>
          <input
            id="org-name"
            className={inputClassName}
            {...register('name', {
              onChange: (event: { target: { value: string } }) => {
                if (!slugTouched) setValue('slug', slugify(event.target.value))
              },
            })}
          />
        </FormField>
        <FormField label="Slug" htmlFor="org-slug" required error={errors.slug?.message}>
          <input
            id="org-slug"
            className={inputClassName}
            {...register('slug', { onChange: () => setSlugTouched(true) })}
          />
        </FormField>

        <SectionTitle>Assinatura</SectionTitle>
        <div className="grid grid-cols-2 gap-4">
          <FormField label="Plano" htmlFor="org-plan" required error={errors.plan?.message}>
            <select
              id="org-plan"
              className={inputClassName}
              {...register('plan', {
                // Sugere os assentos do plano; dá para trocar depois
                onChange: (event: { target: { value: string } }) => {
                  const chosen = plans?.find((item) => item.id === event.target.value)
                  if (chosen) setValue('seats', String(chosen.seats))
                },
              })}
            >
              {(plans ?? []).map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name} · {formatMoney(item.price)}
                </option>
              ))}
            </select>
          </FormField>
          <FormField label="Usuários (assentos)" htmlFor="org-seats" required error={errors.seats?.message}>
            <input id="org-seats" type="number" inputMode="numeric" min={1} className={inputClassName} {...register('seats')} />
          </FormField>
          <FormField label="Situação" htmlFor="org-status" error={errors.subscriptionStatus?.message}>
            <select id="org-status" className={inputClassName} {...register('subscriptionStatus')}>
              {SUBSCRIPTION_STATUSES.map((value: SubscriptionStatus) => (
                <option key={value} value={value}>
                  {STATUS_META[value].label}
                </option>
              ))}
            </select>
          </FormField>
          <FormField label="Valor mensal (R$)" htmlFor="org-price" error={errors.monthlyPrice?.message}>
            <input
              id="org-price"
              inputMode="decimal"
              placeholder={tablePrice !== null ? String(tablePrice).replace('.', ',') : ''}
              className={inputClassName}
              {...register('monthlyPrice')}
            />
          </FormField>
          {status === 'teste' ? (
            <FormField label="Fim do teste" htmlFor="org-trial" error={errors.trialEndsAt?.message}>
              <input id="org-trial" type="date" className={inputClassName} {...register('trialEndsAt')} />
            </FormField>
          ) : (
            <FormField label="Vencimento" htmlFor="org-period" error={errors.currentPeriodEnd?.message}>
              <input id="org-period" type="date" className={inputClassName} {...register('currentPeriodEnd')} />
            </FormField>
          )}
        </div>
        <p className="text-xs text-neutral-400">
          Valor em branco usa a tabela ({formatMoney(tablePrice)}). Fim do teste em branco: 14 dias a partir de hoje.
        </p>

        <SectionTitle>Diretor (primeiro acesso)</SectionTitle>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField label="Nome" htmlFor="org-director-name" required error={errors.directorName?.message}>
            <input id="org-director-name" className={inputClassName} {...register('directorName')} />
          </FormField>
          <FormField label="E-mail" htmlFor="org-director-email" required error={errors.directorEmail?.message}>
            <input id="org-director-email" type="email" className={inputClassName} {...register('directorEmail')} />
          </FormField>
        </div>
        <FormField label="Senha" htmlFor="org-director-password" error={errors.directorPassword?.message}>
          <input
            id="org-director-password"
            type="password"
            autoComplete="new-password"
            placeholder="Em branco: gerar automaticamente"
            className={inputClassName}
            {...register('directorPassword')}
          />
        </FormField>

        <SectionTitle>Cobrança</SectionTitle>
        <BillingInfoFields register={register} control={control} errors={errors} idPrefix="org-billing" />

        <div>
          <label htmlFor="org-notes" className={labelClassName}>
            Anotações internas
          </label>
          <textarea id="org-notes" rows={3} className={inputClassName} {...register('notes')} />
        </div>

        {errors.root?.message && (
          <p role="alert" className="rounded-[12px] bg-danger/10 px-3 py-2 text-sm text-danger">
            {errors.root.message}
          </p>
        )}
      </form>

      <DialogFooter className="mx-0 mb-0 shrink-0 flex-row justify-end gap-2 rounded-b-2xl border-t-[0.5px] border-neutral-200 bg-white p-4 sm:p-6">
        <button
          type="button"
          onClick={onCancel}
          className="min-h-11 rounded-[8px] border-[1.5px] border-neutral-200 px-4 py-2.5 text-sm font-medium text-neutral-600 hover:bg-neutral-100"
        >
          Cancelar
        </button>
        <button
          type="button"
          disabled={create.isPending}
          onClick={handleSubmit((values) => create.mutate(toInput(values)))}
          className="min-h-11 rounded-[8px] bg-brand px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-dark disabled:opacity-60"
        >
          {create.isPending ? 'Criando...' : 'Criar imobiliária'}
        </button>
      </DialogFooter>
    </>
  )
}

export function NewOrganizationDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const [created, setCreated] = useState<CreatedOrganization | null>(null)

  function handleOpenChange(next: boolean) {
    if (!next) setCreated(null)
    onOpenChange(next)
  }

  function handleCreated(result: CreatedOrganization) {
    if (result.temporaryPassword) setCreated(result)
    else {
      toast.add({ title: `${result.organization.name} criada`, type: 'success' })
      handleOpenChange(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="flex max-h-[92vh] w-[calc(100%-1rem)] max-w-xl flex-col gap-0 rounded-2xl border-[0.5px] border-neutral-200 bg-white p-0 ring-0">
        <DialogHeader className="shrink-0 gap-1 border-b-[0.5px] border-neutral-200 p-4 pr-12 sm:p-6 sm:pr-14">
          <DialogTitle>{created ? 'Imobiliária criada' : 'Nova imobiliária'}</DialogTitle>
          <DialogDescription>
            {created ? 'Repasse o e-mail e a senha ao diretor.' : 'Cria a imobiliária e o primeiro diretor de uma vez.'}
          </DialogDescription>
        </DialogHeader>

        {open && created?.temporaryPassword && (
          <>
            <div className="flex-1 space-y-4 overflow-y-auto p-4 sm:p-6">
              <p className="text-sm text-neutral-600">
                <span className="font-medium text-neutral-900">{created.organization.name}</span> está pronta. Login do
                diretor: <span className="font-medium text-neutral-900">{created.director.email}</span>
              </p>
              <TemporaryPasswordBox password={created.temporaryPassword} />
            </div>
            <DialogFooter className="mx-0 mb-0 shrink-0 flex-row justify-end rounded-b-2xl border-t-[0.5px] border-neutral-200 bg-white p-4 sm:p-6">
              <button
                type="button"
                onClick={() => handleOpenChange(false)}
                className="min-h-11 rounded-[8px] bg-brand px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-dark"
              >
                Concluir
              </button>
            </DialogFooter>
          </>
        )}
        {open && !created && <NewOrganizationForm onCancel={() => handleOpenChange(false)} onCreated={handleCreated} />}
      </DialogContent>
    </Dialog>
  )
}
