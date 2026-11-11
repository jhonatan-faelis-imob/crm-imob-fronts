'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Ban, CircleCheck, Wallet } from 'lucide-react'
import { useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { z } from 'zod'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from '@/components/ui/toast'
import { billingInfoValues } from '@/features/assinatura/billing-info-form'
import { BillingInfoFields, billingInfoShape } from '@/features/assinatura/billing-info-fields'
import { formatDateTime, formatMoney, STATUS_META, SUBSCRIPTION_STATUSES, toDateInput } from '@/features/assinatura/constants'
import { apiErrorMessage } from '@/features/equipe/api'
import { ROLE_META, ROLES } from '@/features/equipe/constants'
import { FormField, inputClassName, labelClassName } from '@/features/equipe/field'
import { cn } from '@/lib/utils'
import { adminService, type AdminOrganizationDetail, type OrganizationChange } from '@/services/admin.service'
import type { SubscriptionStatus } from '@/services/billing.service'
import { PaymentDialog, ReasonDialog } from './organization-actions'
import { isValidSeats, moneyInput, parseMoney, suggestedPrice } from './rules'
import { invalidateAdmin, useAdminOrganization, usePlans } from './use-admin'

const schema = z.object({
  name: z.string().trim().min(1, 'Informe o nome').max(120),
  plan: z.string().min(1),
  seats: z.string().refine(isValidSeats, 'Entre 1 e 1000'),
  subscriptionStatus: z.enum(['teste', 'ativa', 'atrasada', 'bloqueada', 'cancelada']),
  monthlyPrice: z.string().refine((value) => value.trim() === '' || parseMoney(value) !== null, 'Valor inválido'),
  currentPeriodEnd: z.string(),
  trialEndsAt: z.string(),
  notes: z.string().max(5000),
  ...billingInfoShape,
})

type FormValues = z.infer<typeof schema>

function toValues(organization: AdminOrganizationDetail): FormValues {
  return {
    name: organization.name,
    plan: organization.plan,
    seats: String(organization.seats),
    subscriptionStatus: organization.subscriptionStatus,
    monthlyPrice: moneyInput(organization.monthlyPrice),
    currentPeriodEnd: toDateInput(organization.currentPeriodEnd),
    trialEndsAt: toDateInput(organization.trialEndsAt),
    notes: organization.notes ?? '',
    ...billingInfoValues(organization),
  }
}

/** Só o que mudou em relação ao que veio do servidor */
function changes(values: FormValues, initial: FormValues): OrganizationChange {
  const change: OrganizationChange = {}
  if (values.name !== initial.name) change.name = values.name.trim()
  if (values.plan !== initial.plan) change.plan = values.plan
  if (values.seats !== initial.seats) change.seats = Number(values.seats)
  if (values.subscriptionStatus !== initial.subscriptionStatus) change.subscriptionStatus = values.subscriptionStatus
  if (values.monthlyPrice !== initial.monthlyPrice) change.monthlyPrice = parseMoney(values.monthlyPrice)
  if (values.currentPeriodEnd !== initial.currentPeriodEnd) change.currentPeriodEnd = values.currentPeriodEnd || null
  if (values.trialEndsAt !== initial.trialEndsAt) change.trialEndsAt = values.trialEndsAt || null
  if (values.notes !== initial.notes) change.notes = values.notes
  for (const key of ['billingName', 'billingDocument', 'billingEmail', 'billingPhone'] as const) {
    if (values[key] !== initial[key]) change[key] = values[key].trim()
  }
  return change
}

function EditForm({ organization }: { organization: AdminOrganizationDetail }) {
  const queryClient = useQueryClient()
  const { data: plans } = usePlans()
  const initial = toValues(organization)
  const {
    register,
    control,
    handleSubmit,
    setValue,
    setError,
    formState: { errors, isDirty },
  } = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: initial })
  const [plan, seats] = useWatch({ control, name: ['plan', 'seats'] })
  const tablePrice = suggestedPrice(plans, plan, Number(seats) || 0)

  const save = useMutation({
    mutationFn: (change: OrganizationChange) => adminService.update(organization.id, change),
    onSuccess: () => {
      invalidateAdmin(queryClient)
      toast.add({ title: 'Alterações salvas', type: 'success' })
    },
    onError: (error) => {
      const message = apiErrorMessage(error, 'Não foi possível salvar.')
      if (/assentos|usuários ativos/i.test(message)) setError('seats', { message })
      else if (/cpf|cnpj/i.test(message)) setError('billingDocument', { message })
      else setError('root', { message })
    },
  })

  function onSubmit(values: FormValues) {
    const change = changes(values, initial)
    if (Object.keys(change).length > 0) save.mutate(change)
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
      <FormField label="Nome" htmlFor="edit-name" required error={errors.name?.message}>
        <input id="edit-name" className={inputClassName} {...register('name')} />
      </FormField>
      <div className="grid grid-cols-2 gap-4">
        <FormField label="Plano" htmlFor="edit-plan" error={errors.plan?.message}>
          <select
            id="edit-plan"
            className={inputClassName}
            {...register('plan', {
              // Sugere os assentos do novo plano, sem impedir outro valor
              onChange: (event: { target: { value: string } }) => {
                const chosen = plans?.find((item) => item.id === event.target.value)
                if (chosen) setValue('seats', String(Math.max(chosen.seats, organization.activeUsers)), { shouldDirty: true })
              },
            })}
          >
            {!plans?.some((item) => item.id === organization.plan) && (
              <option value={organization.plan}>{organization.planName} (antigo)</option>
            )}
            {(plans ?? []).map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </select>
        </FormField>
        <FormField label="Usuários (assentos)" htmlFor="edit-seats" error={errors.seats?.message}>
          <input id="edit-seats" type="number" inputMode="numeric" min={1} className={inputClassName} {...register('seats')} />
        </FormField>
        <FormField label="Situação" htmlFor="edit-status" error={errors.subscriptionStatus?.message}>
          <select id="edit-status" className={inputClassName} {...register('subscriptionStatus')}>
            {SUBSCRIPTION_STATUSES.map((value: SubscriptionStatus) => (
              <option key={value} value={value}>
                {STATUS_META[value].label}
              </option>
            ))}
          </select>
        </FormField>
        <FormField label="Valor mensal (R$)" htmlFor="edit-price" error={errors.monthlyPrice?.message}>
          <input id="edit-price" inputMode="decimal" className={inputClassName} {...register('monthlyPrice')} />
        </FormField>
        <FormField label="Vencimento" htmlFor="edit-period" error={errors.currentPeriodEnd?.message}>
          <input id="edit-period" type="date" className={inputClassName} {...register('currentPeriodEnd')} />
        </FormField>
        <FormField label="Fim do teste" htmlFor="edit-trial" error={errors.trialEndsAt?.message}>
          <input id="edit-trial" type="date" className={inputClassName} {...register('trialEndsAt')} />
        </FormField>
      </div>
      <p className="text-xs text-neutral-400">
        Tabela para este plano e assentos: {formatMoney(tablePrice)}. Usuários ativos agora: {organization.activeUsers}.
      </p>

      <h4 className="pt-2 text-[13px] font-semibold uppercase tracking-wide text-neutral-400">Cobrança</h4>
      <BillingInfoFields register={register} control={control} errors={errors} idPrefix="edit-billing" />

      <div>
        <label htmlFor="edit-notes" className={labelClassName}>
          Anotações internas
        </label>
        <textarea id="edit-notes" rows={3} className={inputClassName} {...register('notes')} />
      </div>

      {errors.root?.message && (
        <p role="alert" className="rounded-[12px] bg-danger/10 px-3 py-2 text-sm text-danger">
          {errors.root.message}
        </p>
      )}
      <button
        type="submit"
        disabled={!isDirty || save.isPending}
        className="min-h-11 w-full rounded-[8px] bg-brand px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-dark disabled:opacity-60"
      >
        {save.isPending ? 'Salvando...' : 'Salvar alterações'}
      </button>
    </form>
  )
}

const EVENT_LABEL: Record<string, string> = {
  plano_alterado: 'Plano',
  bloqueada: 'Bloqueio',
  desbloqueada: 'Desbloqueio',
  teste_estendido: 'Teste',
  pagamento_registrado: 'Pagamento',
  observacao: 'Nota',
}

function roleLabel(role: string) {
  const known = ROLES.find((item) => item === role)
  return known ? ROLE_META[known].label : role
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3 rounded-[16px] border-[0.5px] border-neutral-200 bg-white p-4">
      <h3 className="text-[15px] font-semibold text-neutral-900">{title}</h3>
      {children}
    </section>
  )
}

export function OrganizationSheet({ organizationId, onClose }: { organizationId: string | null; onClose: () => void }) {
  const { data: organization, isLoading } = useAdminOrganization(organizationId)
  const [reasonAction, setReasonAction] = useState<'block' | 'unblock' | null>(null)
  const [paying, setPaying] = useState(false)
  const blocked = organization?.subscriptionStatus === 'bloqueada' || organization?.subscriptionStatus === 'cancelada'

  return (
    <Sheet open={organizationId !== null} onOpenChange={(open) => !open && onClose()}>
      <SheetContent side="right" className="w-full gap-0 overflow-y-auto bg-[#F7F5F3] p-0 sm:max-w-lg">
        <SheetHeader className="border-b-[0.5px] border-neutral-200 bg-white p-4 pr-12 sm:p-6 sm:pr-14">
          <SheetTitle>{organization?.name ?? 'Imobiliária'}</SheetTitle>
          <SheetDescription>
            {organization
              ? `${organization.slug} · ${organization.activeUsers}/${organization.seats} usuários · ${organization.leads} leads`
              : 'Carregando...'}
          </SheetDescription>
        </SheetHeader>

        {(isLoading || !organization) && (
          <div className="space-y-3 p-4">
            <Skeleton className="h-24 rounded-[16px]" />
            <Skeleton className="h-96 rounded-[16px]" />
          </div>
        )}

        {organization && (
          <div className="space-y-4 p-4 sm:p-6">
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={cn(
                  'rounded-full px-3 py-1 text-xs font-semibold',
                  STATUS_META[organization.subscriptionStatus]?.className,
                )}
              >
                {STATUS_META[organization.subscriptionStatus]?.label ?? organization.subscriptionStatus}
              </span>
              <span className="text-sm text-neutral-600">
                {organization.planName} · {formatMoney(organization.monthlyPrice)}
              </span>
            </div>

            <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
              <button
                type="button"
                onClick={() => setPaying(true)}
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-[8px] bg-brand px-3 text-sm font-medium text-white hover:bg-brand-dark"
              >
                <Wallet className="h-4 w-4" />
                Registrar pagamento
              </button>
              {blocked ? (
                <button
                  type="button"
                  onClick={() => setReasonAction('unblock')}
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-[8px] border-[1.5px] border-success px-3 text-sm font-medium text-success sm:col-span-2"
                >
                  <CircleCheck className="h-4 w-4" />
                  Desbloquear
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setReasonAction('block')}
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-[8px] border-[1.5px] border-danger px-3 text-sm font-medium text-danger sm:col-span-2"
                >
                  <Ban className="h-4 w-4" />
                  Bloquear
                </button>
              )}
            </div>

            <Section title="Assinatura e cobrança">
              {/* key: recomeça com os dados novos depois de salvar ou de outra ação */}
              <EditForm key={`${organization.id}-${organization.billingEvents[0]?.id ?? ''}`} organization={organization} />
            </Section>

            <Section title={`Usuários (${organization.users.length})`}>
              <ul className="divide-y-[0.5px] divide-neutral-200">
                {organization.users.map((user) => (
                  <li key={user.id} className="flex items-center gap-2 py-2 text-sm">
                    <div className="min-w-0 flex-1">
                      <p className={cn('truncate font-medium', user.active ? 'text-neutral-900' : 'text-neutral-400 line-through')}>
                        {user.name}
                      </p>
                      <p className="truncate text-xs text-neutral-400">
                        {user.email} · último acesso {formatDateTime(user.lastLogin)}
                      </p>
                    </div>
                    <span className="shrink-0 text-xs text-neutral-600">{roleLabel(user.role)}</span>
                  </li>
                ))}
              </ul>
            </Section>

            <Section title="Histórico">
              {organization.billingEvents.length === 0 ? (
                <p className="text-sm text-neutral-400">Nenhum evento ainda.</p>
              ) : (
                <ol className="space-y-3">
                  {organization.billingEvents.map((event) => (
                    <li key={event.id} className="border-l-[1.5px] border-neutral-200 pl-3 text-sm">
                      <p className="text-neutral-900">
                        <span className="mr-1.5 rounded-full bg-neutral-100 px-2 py-0.5 text-[11px] font-medium text-neutral-600">
                          {EVENT_LABEL[event.kind] ?? event.kind}
                        </span>
                        {event.description}
                      </p>
                      <p className="mt-0.5 text-xs text-neutral-400">
                        {formatDateTime(event.createdAt)} · {event.createdBy ?? 'sistema'}
                      </p>
                    </li>
                  ))}
                </ol>
              )}
            </Section>

            <ReasonDialog organization={organization} action={reasonAction} onClose={() => setReasonAction(null)} />
            {paying && <PaymentDialog organization={organization} open={paying} onClose={() => setPaying(false)} />}
          </div>
        )}
      </SheetContent>
    </Sheet>
  )
}
