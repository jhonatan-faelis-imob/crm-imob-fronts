'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { AlertTriangle, ExternalLink } from 'lucide-react'
import { useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { toast } from '@/components/ui/toast'
import { usePlans } from '@/features/admin/use-admin'
import { apiErrorMessage } from '@/features/equipe/api'
import { errorClassName, inputClassName, labelClassName } from '@/features/equipe/field'
import { cn } from '@/lib/utils'
import { billingService, type BillingMe } from '@/services/billing.service'
import { formatDay, formatMoney, STATUS_META } from './constants'
import { PlanPicker, type PlanChoice } from './plan-picker'
import { BILLING_TYPE_LABEL, clampSeats, isFixedSeats, seatsShortfall } from './subscription-rules'
import { invalidateBilling } from './use-billing-actions'

const dialogClassName =
  'flex max-h-[92vh] w-[calc(100%-1rem)] max-w-xl flex-col gap-0 overflow-y-auto rounded-2xl border-[0.5px] border-neutral-200 bg-white p-0 ring-0'
const headerClassName = 'gap-1 border-b-[0.5px] border-neutral-200 p-4 pr-12 sm:p-6 sm:pr-14'
const footerClassName =
  'mx-0 mb-0 flex-row justify-end gap-2 rounded-b-2xl border-t-[0.5px] border-neutral-200 bg-white p-4 sm:p-6'
const secondaryClassName =
  'min-h-11 rounded-[8px] border-[1.5px] border-neutral-200 bg-white px-4 py-2.5 text-sm font-medium text-neutral-900 hover:border-brand hover:text-brand'

const NEXT_CHARGE_NOTICE = 'Alterações valem a partir da próxima cobrança.'

/** Aviso de atraso com o link da cobrança em aberto */
export function OverdueNotice({ billing }: { billing: BillingMe }) {
  return (
    <div role="alert" className="flex flex-col gap-3 rounded-[16px] border-[1.5px] border-warning bg-warning/10 p-4 sm:flex-row sm:items-center">
      <AlertTriangle className="h-5 w-5 shrink-0 text-warning" />
      <div className="min-w-0 flex-1 text-sm text-neutral-900">
        <p className="font-semibold">Sua assinatura está em atraso.</p>
        <p className="text-neutral-600">
          {billing.openPayment
            ? `Cobrança de ${formatMoney(billing.openPayment.value)} com vencimento em ${formatDay(billing.openPayment.dueDate)}.`
            : 'Regularize o pagamento para evitar o bloqueio.'}
        </p>
      </div>
      {billing.openPayment && (
        <a
          href={billing.openPayment.invoiceUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-[8px] bg-warning px-4 text-sm font-semibold text-white"
        >
          Pagar agora
          <ExternalLink className="h-4 w-4" />
        </a>
      )}
    </div>
  )
}

function ChangePlanDialog({
  billing,
  mode,
  onClose,
}: {
  billing: BillingMe
  mode: 'plan' | 'seats' | null
  onClose: () => void
}) {
  const queryClient = useQueryClient()
  const { data: plans } = usePlans(mode !== null)
  const [choice, setChoice] = useState<PlanChoice>({ planId: billing.plan, seats: billing.seats })
  const [error, setError] = useState<string | null>(null)
  const visiblePlans = mode === 'seats' ? (plans ?? []).filter((plan) => plan.id === billing.plan) : (plans ?? [])
  const plan = plans?.find((item) => item.id === choice.planId)
  const seats = plan ? clampSeats(plan, choice.seats) : choice.seats
  const unchanged = choice.planId === billing.plan && seats === billing.seats

  const change = useMutation({
    mutationFn: () => billingService.changeSubscription({ planId: choice.planId, seats }),
    onSuccess: () => {
      invalidateBilling(queryClient)
      toast.add({ title: 'Assinatura alterada', description: NEXT_CHARGE_NOTICE, type: 'success' })
      onClose()
    },
    onError: (failure) => setError(apiErrorMessage(failure, 'Não foi possível alterar. Tente de novo.')),
  })

  return (
    <Dialog open={mode !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className={dialogClassName}>
        <DialogHeader className={headerClassName}>
          <DialogTitle>{mode === 'seats' ? 'Alterar nº de usuários' : 'Mudar de plano'}</DialogTitle>
          <DialogDescription>{NEXT_CHARGE_NOTICE} Não há cobrança proporcional.</DialogDescription>
        </DialogHeader>
        <div className="space-y-3 p-4 sm:p-6">
          {visiblePlans.length > 0 && (
            <PlanPicker
              plans={visiblePlans}
              value={choice}
              onChange={setChoice}
              activeUsers={billing.seatsUsed}
              currentPlanId={billing.plan}
            />
          )}
          {error && <p className={errorClassName}>{error}</p>}
        </div>
        <DialogFooter className={footerClassName}>
          <button type="button" onClick={onClose} className={secondaryClassName}>
            Cancelar
          </button>
          <button
            type="button"
            onClick={() => change.mutate()}
            disabled={unchanged || change.isPending || seatsShortfall(billing.seatsUsed, seats) > 0}
            className="min-h-11 rounded-[8px] bg-brand px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-dark disabled:opacity-50"
          >
            {change.isPending ? 'Salvando...' : 'Confirmar'}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function CancelDialog({ billing, open, onClose }: { billing: BillingMe; open: boolean; onClose: () => void }) {
  const queryClient = useQueryClient()
  const [reason, setReason] = useState('')
  const [error, setError] = useState<string | null>(null)
  const until = billing.status === 'teste' ? billing.trialEndsAt : billing.currentPeriodEnd

  const cancel = useMutation({
    mutationFn: () => billingService.cancel(reason.trim()),
    onSuccess: () => {
      invalidateBilling(queryClient)
      toast.add({ title: 'Assinatura cancelada', description: `O acesso continua até ${formatDay(until)}.`, type: 'success' })
      onClose()
    },
    onError: (failure) => setError(apiErrorMessage(failure, 'Não foi possível cancelar. Tente de novo.')),
  })

  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent className="w-[calc(100%-1rem)] max-w-sm gap-0 rounded-2xl border-[0.5px] border-neutral-200 bg-white p-0 ring-0">
        <DialogHeader className={headerClassName}>
          <DialogTitle>Cancelar assinatura</DialogTitle>
          <DialogDescription>
            Não haverá novas cobranças. Você continua usando o sistema até {formatDay(until)}; depois ele fica somente
            leitura.
          </DialogDescription>
        </DialogHeader>
        <div className="p-4 sm:p-6">
          <label htmlFor="cancel-reason" className={labelClassName}>
            Por que você está cancelando?
          </label>
          <textarea
            id="cancel-reason"
            rows={3}
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            className={inputClassName}
          />
          {error && <p className={errorClassName}>{error}</p>}
        </div>
        <DialogFooter className={footerClassName}>
          <button type="button" onClick={onClose} className={secondaryClassName}>
            Voltar
          </button>
          <button
            type="button"
            onClick={() => cancel.mutate()}
            disabled={reason.trim() === '' || cancel.isPending}
            className="min-h-11 rounded-[8px] bg-danger px-4 py-2.5 text-sm font-medium text-white disabled:opacity-50"
          >
            {cancel.isPending ? 'Cancelando...' : 'Cancelar assinatura'}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

/** Assinatura em vigor: resumo, mudar plano ou usuários, cancelar */
export function ActiveSubscription({ billing }: { billing: BillingMe }) {
  const { data: plans } = usePlans()
  const [changing, setChanging] = useState<'plan' | 'seats' | null>(null)
  const [canceling, setCanceling] = useState(false)
  const currentPlan = plans?.find((plan) => plan.id === billing.plan)
  const statusMeta = STATUS_META[billing.status]

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm text-neutral-400">Plano atual</p>
          <p className="text-[22px] font-semibold text-neutral-900">
            {billing.planName} · {billing.seats === 1 ? '1 usuário' : `${billing.seats} usuários`}
          </p>
        </div>
        <span className={cn('rounded-full px-3 py-1 text-xs font-semibold', statusMeta?.className)}>
          {statusMeta?.label ?? billing.status}
        </span>
      </div>

      <dl className="grid grid-cols-2 gap-4 text-sm sm:grid-cols-3">
        <div>
          <dt className="text-neutral-400">Valor mensal</dt>
          <dd className="font-medium text-neutral-900">{formatMoney(billing.monthlyPrice)}</dd>
        </div>
        <div>
          <dt className="text-neutral-400">Próxima cobrança</dt>
          <dd className="font-medium text-neutral-900">{formatDay(billing.currentPeriodEnd ?? billing.trialEndsAt)}</dd>
        </div>
        <div>
          <dt className="text-neutral-400">Forma de pagamento</dt>
          <dd className="font-medium text-neutral-900">{BILLING_TYPE_LABEL[billing.billingType ?? ''] ?? '—'}</dd>
        </div>
      </dl>

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
        <button type="button" onClick={() => setChanging('plan')} className={secondaryClassName}>
          Mudar de plano
        </button>
        {currentPlan && !isFixedSeats(currentPlan) && (
          <button type="button" onClick={() => setChanging('seats')} className={secondaryClassName}>
            Alterar nº de usuários
          </button>
        )}
        <button
          type="button"
          onClick={() => setCanceling(true)}
          className="min-h-11 rounded-[8px] px-4 py-2.5 text-sm font-medium text-danger hover:bg-danger/10"
        >
          Cancelar assinatura
        </button>
      </div>
      <p className="text-xs text-neutral-400">{NEXT_CHARGE_NOTICE}</p>

      {changing && <ChangePlanDialog billing={billing} mode={changing} onClose={() => setChanging(null)} />}
      {canceling && <CancelDialog billing={billing} open={canceling} onClose={() => setCanceling(false)} />}
    </div>
  )
}
