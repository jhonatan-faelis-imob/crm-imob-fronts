'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { CreditCard, Lock } from 'lucide-react'
import { useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Skeleton } from '@/components/ui/skeleton'
import { usePlans } from '@/features/admin/use-admin'
import { apiErrorMessage } from '@/features/equipe/api'
import { cn } from '@/lib/utils'
import { billingService, type BillingMe, type SubscribeBillingType } from '@/services/billing.service'
import { BillingInfoForm } from './billing-info-form'
import { PlanPicker, type PlanChoice } from './plan-picker'
import { BILLING_TYPE_OPTIONS, clampSeats, missingBillingInfo, seatsShortfall } from './subscription-rules'
import { invalidateBilling } from './use-billing-actions'

/** Escolha de plano, usuários e forma de pagamento; "Assinar" leva à página de pagamento do Asaas */
export function SubscribePanel({ billing }: { billing: BillingMe }) {
  const queryClient = useQueryClient()
  const { data: plans, isLoading } = usePlans()
  const [choice, setChoice] = useState<PlanChoice>({
    planId: billing.plan,
    seats: Math.max(billing.seats, billing.seatsUsed),
  })
  const [billingType, setBillingType] = useState<SubscribeBillingType>('CREDIT_CARD')
  const [askBillingInfo, setAskBillingInfo] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const plan = plans?.find((item) => item.id === choice.planId) ?? plans?.[0]
  const seats = plan ? clampSeats(plan, choice.seats) : choice.seats
  const blockedBySeats = seatsShortfall(billing.seatsUsed, seats) > 0

  const subscribe = useMutation({
    mutationFn: () => billingService.subscribe({ planId: plan?.id ?? choice.planId, seats, billingType }),
    onSuccess: (result) => {
      invalidateBilling(queryClient)
      // Pagamento na página do Asaas: o cartão nunca passa pelo sistema. Quem libera o acesso é o webhook
      window.location.href = result.redirectUrl ?? '/assinatura/retorno'
    },
    onError: (failure) => {
      const message = apiErrorMessage(failure, 'Não foi possível criar a assinatura. Tente de novo.')
      if (/dados de cobrança/i.test(message)) setAskBillingInfo(true)
      setError(message)
    },
  })

  function start() {
    setError(null)
    if (missingBillingInfo(billing.billing).length > 0) setAskBillingInfo(true)
    else subscribe.mutate()
  }

  if (isLoading || !plans) return <Skeleton className="h-80 rounded-[16px]" />

  return (
    <div className="space-y-5">
      <PlanPicker plans={plans} value={choice} onChange={setChoice} activeUsers={billing.seatsUsed} />

      <fieldset>
        <legend className="mb-2 text-sm font-medium text-neutral-900">Forma de pagamento</legend>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
          {BILLING_TYPE_OPTIONS.map((option) => (
            <label
              key={option.value}
              className={cn(
                'flex min-h-11 cursor-pointer flex-col rounded-[12px] border-[1.5px] px-3 py-2.5 has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-brand',
                billingType === option.value ? 'border-brand bg-brand-bg' : 'border-neutral-200 bg-white',
              )}
            >
              <input
                type="radio"
                name="billing-type"
                value={option.value}
                checked={billingType === option.value}
                onChange={() => setBillingType(option.value)}
                className="sr-only"
              />
              <span className="text-sm font-medium text-neutral-900">{option.label}</span>
              <span className="text-xs text-neutral-400">{option.hint}</span>
            </label>
          ))}
        </div>
      </fieldset>

      {error && (
        <p role="alert" className="rounded-[12px] bg-danger/10 px-3 py-2 text-sm text-danger">
          {error}
        </p>
      )}

      <button
        type="button"
        onClick={start}
        disabled={subscribe.isPending || blockedBySeats}
        className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-[8px] bg-brand px-4 text-[15px] font-semibold text-white hover:bg-brand-dark disabled:opacity-60"
      >
        <CreditCard className="h-4 w-4" />
        {subscribe.isPending ? 'Abrindo o pagamento...' : 'Assinar'}
      </button>
      <p className="flex items-center justify-center gap-1.5 text-center text-xs text-neutral-400">
        <Lock className="h-3.5 w-3.5" />
        Pagamento no ambiente seguro do Asaas. Seus dados de cartão não passam pelo Smart CRM.
      </p>

      <Dialog open={askBillingInfo} onOpenChange={setAskBillingInfo}>
        <DialogContent className="flex max-h-[92vh] w-[calc(100%-1rem)] max-w-lg flex-col gap-0 overflow-y-auto rounded-2xl border-[0.5px] border-neutral-200 bg-white p-0 ring-0">
          <DialogHeader className="gap-1 border-b-[0.5px] border-neutral-200 p-4 pr-12 sm:p-6 sm:pr-14">
            <DialogTitle>Dados de cobrança</DialogTitle>
            <DialogDescription>Usados pelo Asaas para emitir a cobrança.</DialogDescription>
          </DialogHeader>
          <div className="p-4 sm:p-6">
            <BillingInfoForm
              info={billing.billing}
              submitLabel="Salvar e assinar"
              onSaved={(saved) => {
                if (missingBillingInfo(saved).length > 0) {
                  setError(`Preencha todos os dados de cobrança: ${missingBillingInfo(saved).join(', ')}.`)
                  return
                }
                setAskBillingInfo(false)
                setError(null)
                subscribe.mutate()
              }}
            />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
