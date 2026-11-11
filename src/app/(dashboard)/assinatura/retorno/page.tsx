'use client'

import { CheckCircle2, Clock, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { PAID_STATUSES } from '@/features/assinatura/subscription-rules'
import { useBillingPayments } from '@/features/assinatura/use-billing-actions'
import { useBillingMe } from '@/features/assinatura/use-billing-me'
import { useHydrated } from '@/lib/use-hydrated'

const POLL_MS = 5_000
const MAX_WAIT_MS = 2 * 60_000

/**
 * Volta do Asaas. Nunca libera acesso só porque o cliente voltou: espera o webhook confirmar
 * (situação ativa e uma cobrança paga), consultando a cada 5 s por até 2 minutos
 */
export default function AssinaturaRetornoPage() {
  const isHydrated = useHydrated()
  const [startedAt] = useState(() => Date.now())
  const [timedOut, setTimedOut] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setTimedOut(true), MAX_WAIT_MS)
    return () => clearTimeout(timer)
  }, [startedAt])

  // Para de consultar ao confirmar (situação do render anterior) ou depois de 2 minutos
  const [confirmedSeen, setConfirmedSeen] = useState(false)
  const polling = isHydrated && !timedOut && !confirmedSeen
  const billing = useBillingMe(isHydrated, polling ? POLL_MS : false)
  const payments = useBillingPayments(isHydrated, polling ? POLL_MS : false)

  const confirmed =
    billing.data?.status === 'ativa' && (payments.data ?? []).some((payment) => PAID_STATUSES.includes(payment.status))
  if (confirmed && !confirmedSeen) setConfirmedSeen(true)

  return (
    <div className="mx-auto flex max-w-md flex-col items-center gap-4 rounded-[16px] border-[0.5px] border-neutral-200 bg-white p-6 text-center sm:p-8">
      {confirmed ? (
        <>
          <CheckCircle2 className="h-10 w-10 text-success" />
          <h1 className="text-[22px] font-semibold text-neutral-900">Pagamento confirmado</h1>
          <p className="text-sm text-neutral-600">Sua assinatura está ativa. Obrigado!</p>
        </>
      ) : (
        <>
          {timedOut ? (
            <Clock className="h-10 w-10 text-neutral-400" />
          ) : (
            <Loader2 className="h-10 w-10 animate-spin text-brand" />
          )}
          <h1 className="text-[22px] font-semibold text-neutral-900">Estamos confirmando seu pagamento</h1>
          <p className="text-sm text-neutral-600">
            A confirmação pode levar alguns minutos. Você pode fechar esta página.
          </p>
          {timedOut && (
            <p className="text-xs text-neutral-400">
              Ainda não recebemos a confirmação. Ela aparece sozinha na página da assinatura assim que chegar.
            </p>
          )}
        </>
      )}
      <Link
        href="/assinatura"
        className="inline-flex min-h-11 items-center justify-center rounded-[8px] border-[1.5px] border-neutral-200 px-4 text-sm font-medium text-neutral-900 hover:border-brand hover:text-brand"
      >
        Ver assinatura
      </Link>
    </div>
  )
}
