'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { RefreshCw } from 'lucide-react'
import { toast } from '@/components/ui/toast'
import { formatDay } from '@/features/assinatura/constants'
import { PaymentsList } from '@/features/assinatura/payments-list'
import { BILLING_TYPE_LABEL } from '@/features/assinatura/subscription-rules'
import { apiErrorMessage } from '@/features/equipe/api'
import { adminService, type AdminOrganizationDetail } from '@/services/admin.service'
import { invalidateAdmin } from './use-admin'

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3 text-sm">
      <dt className="shrink-0 text-neutral-400">{label}</dt>
      <dd className="min-w-0 truncate text-right font-mono text-[13px] text-neutral-900">{value}</dd>
    </div>
  )
}

/** Dados do Asaas, últimas cobranças e sincronização manual */
export function AsaasSection({ organization }: { organization: AdminOrganizationDetail }) {
  const queryClient = useQueryClient()
  const sync = useMutation({
    mutationFn: () => adminService.syncAsaas(organization.id),
    onSuccess: (result) => {
      invalidateAdmin(queryClient)
      toast.add({
        title: 'Sincronizado com o Asaas',
        description: `${result.payments} cobranças · situação ${result.statusBefore} → ${result.statusAfter}`,
        type: 'success',
      })
    },
    onError: (error) =>
      toast.add({ title: 'Não foi possível sincronizar', description: apiErrorMessage(error, ''), type: 'error' }),
  })

  return (
    <div className="space-y-3">
      <dl className="space-y-1.5">
        <Row label="Cliente" value={organization.asaasCustomerId ?? '—'} />
        <Row label="Assinatura" value={organization.asaasSubscriptionId ?? '—'} />
        <Row label="Forma" value={BILLING_TYPE_LABEL[organization.billingType ?? ''] ?? '—'} />
        {organization.canceledAt && (
          <Row label="Cancelada em" value={`${formatDay(organization.canceledAt)} · ${organization.cancelReason ?? ''}`} />
        )}
      </dl>
      <button
        type="button"
        onClick={() => sync.mutate()}
        disabled={!organization.asaasSubscriptionId || sync.isPending}
        className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-[8px] border-[1.5px] border-neutral-200 px-3 text-sm font-medium text-neutral-900 hover:border-brand hover:text-brand disabled:opacity-50"
      >
        <RefreshCw className={sync.isPending ? 'h-4 w-4 animate-spin' : 'h-4 w-4'} />
        Sincronizar com Asaas
      </button>
      <PaymentsList payments={organization.payments} isLoading={false} />
    </div>
  )
}
