import { ExternalLink, Receipt } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import type { PaymentRow } from '@/services/billing.service'
import { formatDay, formatMoney } from './constants'
import { BILLING_TYPE_LABEL, paymentStatusMeta } from './subscription-rules'

/** Cobranças do Asaas, com link para a fatura */
export function PaymentsList({ payments, isLoading }: { payments: PaymentRow[] | undefined; isLoading: boolean }) {
  if (isLoading) return <Skeleton className="h-32 rounded-[12px]" />
  if (!payments || payments.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 py-6 text-center">
        <Receipt className="h-5 w-5 text-neutral-400" />
        <p className="text-sm text-neutral-400">Nenhuma cobrança ainda.</p>
      </div>
    )
  }

  return (
    <ul className="divide-y-[0.5px] divide-neutral-200">
      {payments.map((payment) => {
        const meta = paymentStatusMeta(payment.status)
        return (
          <li key={payment.id} className="flex items-center gap-3 py-3">
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-neutral-900">
                {formatMoney(payment.value)}{' '}
                <span className={cn('ml-1 rounded-full px-2 py-0.5 text-[11px] font-semibold', meta.className)}>{meta.label}</span>
              </p>
              <p className="text-xs text-neutral-400">
                Vence {formatDay(payment.dueDate)}
                {payment.paidAt ? ` · Paga em ${formatDay(payment.paidAt)}` : ''}
                {payment.billingType ? ` · ${BILLING_TYPE_LABEL[payment.billingType] ?? payment.billingType}` : ''}
              </p>
            </div>
            {payment.invoiceUrl && (
              <a
                href={payment.invoiceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-11 shrink-0 items-center gap-1.5 rounded-[8px] px-3 text-sm font-medium text-brand hover:bg-brand-bg"
              >
                Fatura
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            )}
          </li>
        )
      })}
    </ul>
  )
}
