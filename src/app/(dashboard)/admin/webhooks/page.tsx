'use client'

import { useQuery } from '@tanstack/react-query'
import { ArrowLeft, RefreshCw, ShieldCheck } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'
import { Skeleton } from '@/components/ui/skeleton'
import { formatDateTime } from '@/features/assinatura/constants'
import { useBillingMe } from '@/features/assinatura/use-billing-me'
import { useHydrated } from '@/lib/use-hydrated'
import { cn } from '@/lib/utils'
import { adminService, type WebhookDelivery } from '@/services/admin.service'

const STATUS_CLASS: Record<WebhookDelivery['status'], string> = {
  ok: 'bg-success/10 text-success',
  ignorado: 'bg-canvas text-muted-foreground',
  erro: 'bg-danger/10 text-danger',
}

function DeliveryItem({ delivery }: { delivery: WebhookDelivery }) {
  const [open, setOpen] = useState(false)
  return (
    <li className="rounded-[12px] border-[0.5px] border-line bg-paper">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        className="flex w-full items-start gap-3 p-3 text-left"
      >
        <span className={cn('mt-0.5 shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold', STATUS_CLASS[delivery.status])}>
          {delivery.status}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate font-mono text-[13px] font-medium text-brand">{delivery.event}</span>
          <span className="block truncate text-xs text-muted-foreground">
            {formatDateTime(delivery.createdAt)} · {delivery.message ?? '—'}
          </span>
        </span>
      </button>
      {open && (
        <div className="space-y-2 border-t-[0.5px] border-line p-3 text-xs">
          <p className="text-muted-foreground">
            Evento <span className="font-mono">{delivery.eventId}</span>
            {delivery.organizationId ? (
              <>
                {' '}· organização <span className="font-mono">{delivery.organizationId}</span>
              </>
            ) : null}
          </p>
          <pre className="max-h-72 overflow-auto rounded-[8px] bg-canvas p-2 font-mono text-[11px] text-brand">
            {JSON.stringify(delivery.payload, null, 2)}
          </pre>
        </div>
      )}
    </li>
  )
}

/** Últimas 100 entregas de webhook, para depuração (superadministrador) */
export default function AdminWebhooksPage() {
  const isHydrated = useHydrated()
  const { data: me, isLoading: loadingMe } = useBillingMe(isHydrated)
  const allowed = me?.isSuperAdmin === true
  const deliveries = useQuery({ queryKey: ['admin-webhooks'], queryFn: adminService.webhooks, enabled: allowed })

  if (!isHydrated || loadingMe) return <Skeleton className="h-40 rounded-[16px]" />
  if (!allowed) {
    return (
      <div className="mx-auto flex max-w-md flex-col items-center gap-3 rounded-[16px] border-[0.5px] border-line bg-paper p-8 text-center">
        <ShieldCheck className="h-6 w-6 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">Esta área é restrita ao administrador do sistema.</p>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <Link href="/admin" className="inline-flex min-h-11 items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-brand">
        <ArrowLeft className="h-4 w-4" />
        Administração
      </Link>
      <div className="flex items-end justify-between gap-3">
        <div>
          <h1 className="text-[28px] font-semibold text-brand">Webhooks</h1>
          <p className="text-sm text-muted-foreground">Últimas 100 entregas do Asaas</p>
        </div>
        <button
          type="button"
          onClick={() => deliveries.refetch()}
          aria-label="Atualizar"
          className="flex h-11 w-11 items-center justify-center rounded-[8px] border-[1.5px] border-line bg-paper text-muted-foreground hover:border-brand hover:text-brand"
        >
          <RefreshCw className={deliveries.isFetching ? 'h-4 w-4 animate-spin' : 'h-4 w-4'} />
        </button>
      </div>
      {deliveries.isLoading ? (
        <Skeleton className="h-64 rounded-[16px]" />
      ) : (deliveries.data ?? []).length === 0 ? (
        <p className="rounded-[16px] border-[0.5px] border-line bg-paper p-6 text-center text-sm text-muted-foreground">
          Nenhuma entrega ainda.
        </p>
      ) : (
        <ul className="space-y-2">
          {(deliveries.data ?? []).map((delivery) => (
            <DeliveryItem key={delivery.id} delivery={delivery} />
          ))}
        </ul>
      )}
    </div>
  )
}
