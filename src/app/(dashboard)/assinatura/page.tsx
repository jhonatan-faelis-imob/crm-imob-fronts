'use client'

import { Skeleton } from '@/components/ui/skeleton'
import { ActiveSubscription, OverdueNotice } from '@/features/assinatura/active-subscription'
import { BillingInfoForm } from '@/features/assinatura/billing-info-form'
import { formatDay } from '@/features/assinatura/constants'
import { PaymentsList } from '@/features/assinatura/payments-list'
import { SubscribePanel } from '@/features/assinatura/subscribe-panel'
import { useBillingPayments } from '@/features/assinatura/use-billing-actions'
import { useBillingMe } from '@/features/assinatura/use-billing-me'
import { useHydrated } from '@/lib/use-hydrated'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/store/auth.store'

const cardClassName = 'rounded-[16px] border-[0.5px] border-neutral-200 bg-white p-4 sm:p-6'

export default function AssinaturaPage() {
  const isHydrated = useHydrated()
  const role = useAuthStore((state) => state.user?.role)
  const isDirector = isHydrated && role === 'diretor'
  const { data, isLoading, isError, refetch } = useBillingMe(isDirector)
  const payments = useBillingPayments(isDirector)

  if (isHydrated && !isDirector) {
    return (
      <div className={cn(cardClassName, 'mx-auto max-w-2xl text-center text-sm text-neutral-600')}>
        A assinatura é gerenciada pelo diretor da imobiliária.
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <p className="text-xs font-medium text-neutral-400">Configurações</p>
        <h1 className="text-[28px] font-semibold text-neutral-900">Assinatura</h1>
      </div>

      {(!isHydrated || isLoading) && <Skeleton className="h-96 rounded-[16px]" />}

      {isError && (
        <div className={cn(cardClassName, 'text-center')}>
          <p className="text-sm text-neutral-600">Não foi possível carregar a assinatura.</p>
          <button
            type="button"
            onClick={() => refetch()}
            className="mt-3 min-h-11 rounded-[8px] border-[1.5px] border-neutral-200 px-4 text-sm font-medium text-neutral-900 hover:border-brand hover:text-brand"
          >
            Tentar de novo
          </button>
        </div>
      )}

      {data && (
        <>
          {data.status === 'atrasada' && <OverdueNotice billing={data} />}

          <section className={cn(cardClassName, 'space-y-4')}>
            {data.hasSubscription ? (
              <ActiveSubscription billing={data} />
            ) : (
              <>
                <div>
                  <h2 className="text-[18px] font-semibold text-neutral-900">
                    {data.status === 'teste' && data.daysLeft !== null && data.daysLeft > 0
                      ? `Seu teste termina em ${data.daysLeft} ${data.daysLeft === 1 ? 'dia' : 'dias'}`
                      : 'Escolha seu plano'}
                  </h2>
                  <p className="text-sm text-neutral-400">
                    Todos os planos têm os mesmos recursos; muda só a quantidade de usuários.
                    {data.canceledAt ? ` Assinatura cancelada; acesso até ${formatDay(data.currentPeriodEnd ?? data.trialEndsAt)}.` : ''}
                  </p>
                </div>
                <SubscribePanel billing={data} />
              </>
            )}
          </section>

          <section className={cn(cardClassName, 'space-y-2')}>
            <h2 className="text-[18px] font-semibold text-neutral-900">Cobranças</h2>
            <PaymentsList payments={payments.data} isLoading={payments.isLoading} />
          </section>

          <section className={cn(cardClassName, 'space-y-4')}>
            <div>
              <h2 className="text-[18px] font-semibold text-neutral-900">Dados de cobrança</h2>
              <p className="text-sm text-neutral-400">Usados pelo Asaas para emitir a cobrança.</p>
            </div>
            <BillingInfoForm info={data.billing} />
          </section>
        </>
      )}
    </div>
  )
}
