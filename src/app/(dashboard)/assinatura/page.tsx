'use client'

import { Skeleton } from '@/components/ui/skeleton'
import { BillingInfoForm } from '@/features/assinatura/billing-info-form'
import { formatDay, formatMoney, STATUS_META } from '@/features/assinatura/constants'
import { SupportButton } from '@/features/assinatura/support-button'
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

  if (isHydrated && !isDirector) {
    return (
      <div className={cn(cardClassName, 'mx-auto max-w-2xl text-center text-sm text-neutral-600')}>
        A assinatura é gerenciada pelo diretor da imobiliária.
      </div>
    )
  }

  const usage = data ? Math.min(100, Math.round((data.seatsUsed / Math.max(1, data.seats)) * 100)) : 0
  const full = data ? data.seatsUsed >= data.seats : false
  const inTrial = data?.status === 'teste'
  const statusMeta = data ? STATUS_META[data.status] : undefined

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <p className="text-xs font-medium text-neutral-400">Configurações</p>
        <h1 className="text-[28px] font-semibold text-neutral-900">Assinatura</h1>
      </div>

      {(!isHydrated || isLoading) && (
        <div className="space-y-6">
          <Skeleton className="h-64 rounded-[16px]" />
          <Skeleton className="h-80 rounded-[16px]" />
        </div>
      )}

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
          <section className={cn(cardClassName, 'space-y-5')}>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-sm text-neutral-400">Plano atual</p>
                <p className="text-[22px] font-semibold text-neutral-900">{data.planName}</p>
              </div>
              <span className={cn('rounded-full px-3 py-1 text-xs font-semibold', statusMeta?.className)}>
                {statusMeta?.label ?? data.status}
              </span>
            </div>

            <div>
              <div className="mb-1.5 flex items-baseline justify-between text-sm">
                <span className="text-neutral-600">Usuários ativos</span>
                <span className="font-semibold text-neutral-900">
                  {data.seatsUsed} de {data.seats}
                </span>
              </div>
              <div
                className="h-2 overflow-hidden rounded-full bg-neutral-100"
                role="progressbar"
                aria-valuemin={0}
                aria-valuemax={data.seats}
                aria-valuenow={data.seatsUsed}
                aria-label="Usuários ativos sobre contratados"
              >
                <div
                  className={cn('h-full rounded-full', full ? 'bg-warning' : 'bg-brand')}
                  style={{ width: `${usage}%` }}
                />
              </div>
              {full && <p className="mt-1.5 text-xs text-warning">Todos os usuários contratados estão em uso.</p>}
            </div>

            <dl className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <dt className="text-neutral-400">{inTrial ? 'Fim do teste' : 'Próximo vencimento'}</dt>
                <dd className="font-medium text-neutral-900">
                  {formatDay(inTrial ? data.trialEndsAt : data.currentPeriodEnd)}
                </dd>
              </div>
              <div>
                <dt className="text-neutral-400">Valor mensal</dt>
                <dd className="font-medium text-neutral-900">{formatMoney(data.monthlyPrice)}</dd>
              </div>
            </dl>

            <div className="flex flex-col gap-3 rounded-[12px] bg-neutral-100 p-3 sm:flex-row sm:items-center">
              <p className="flex-1 text-sm text-neutral-600">
                Para mudar de plano ou ampliar usuários, fale com o suporte.
              </p>
              <SupportButton text="Olá! Quero mudar o plano ou ampliar os usuários do CRM Imob." />
            </div>
          </section>

          <section className={cn(cardClassName, 'space-y-4')}>
            <div>
              <h2 className="text-[18px] font-semibold text-neutral-900">Dados de cobrança</h2>
              <p className="text-sm text-neutral-400">Usados para emitir a cobrança.</p>
            </div>
            <BillingInfoForm info={data.billing} />
          </section>
        </>
      )}
    </div>
  )
}
