'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, RefreshCw, Search, ShieldCheck, Webhook } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from '@/components/ui/toast'
import { OrganizationSheet } from '@/features/admin/organization-sheet'
import { OrganizationsList } from '@/features/admin/organizations-list'
import { NewOrganizationDialog } from '@/features/admin/new-organization-dialog'
import { SummaryCards } from '@/features/admin/summary-cards'
import { invalidateAdmin, useAdminOrganizations, useAdminSummary } from '@/features/admin/use-admin'
import { STATUS_META, SUBSCRIPTION_STATUSES } from '@/features/assinatura/constants'
import { useBillingMe } from '@/features/assinatura/use-billing-me'
import { apiErrorMessage } from '@/features/equipe/api'
import { inputClassName } from '@/features/equipe/field'
import { useDebouncedValue } from '@/lib/use-debounced-value'
import { useHydrated } from '@/lib/use-hydrated'
import { adminService } from '@/services/admin.service'

export default function AdminPage() {
  const isHydrated = useHydrated()
  // Quem decide é o backend (SUPER_ADMIN_EMAILS); as rotas /admin também respondem 403 para os outros
  const { data: me, isLoading: loadingMe } = useBillingMe(isHydrated)
  const allowed = me?.isSuperAdmin === true
  const queryClient = useQueryClient()

  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const debouncedSearch = useDebouncedValue(search, 300)
  const [openId, setOpenId] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)

  const summary = useAdminSummary(allowed)
  const organizations = useAdminOrganizations({ search: debouncedSearch, status }, allowed)

  const recalculate = useMutation({
    mutationFn: adminService.recalculate,
    onSuccess: (result) => {
      invalidateAdmin(queryClient)
      toast.add({
        title: result.changed === 0 ? 'Nenhuma situação mudou' : `${result.changed} situações atualizadas`,
        description: result.changes.map((change) => `${change.name}: ${change.from} → ${change.to}`).join(' · ') || undefined,
        type: 'success',
      })
    },
    onError: (error) =>
      toast.add({ title: 'Não foi possível recalcular', description: apiErrorMessage(error, ''), type: 'error' }),
  })

  if (!isHydrated || loadingMe) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-48 rounded-[8px]" />
        <Skeleton className="h-24 rounded-[16px]" />
      </div>
    )
  }

  if (!allowed) {
    return (
      <div className="mx-auto flex max-w-md flex-col items-center gap-3 rounded-[16px] border-[0.5px] border-neutral-200 bg-white p-8 text-center">
        <ShieldCheck className="h-6 w-6 text-neutral-400" />
        <p className="text-sm text-neutral-600">Esta área é restrita ao administrador do sistema.</p>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-medium text-neutral-400">Configurações</p>
          <h1 className="text-[28px] font-semibold text-neutral-900">Administração</h1>
          <p className="text-sm text-neutral-400">
            {summary.data ? `${summary.data.total} imobiliárias` : 'Imobiliárias e assinaturas'}
          </p>
        </div>
        <div className="grid grid-cols-2 gap-2 sm:flex">
          <Link
            href="/admin/webhooks"
            className="col-span-2 inline-flex min-h-11 items-center justify-center gap-2 rounded-[8px] border-[1.5px] border-neutral-200 bg-white px-4 text-sm font-medium text-neutral-900 hover:border-brand hover:text-brand sm:col-span-1"
          >
            <Webhook className="h-4 w-4" />
            Webhooks
          </Link>
          <button
            type="button"
            onClick={() => recalculate.mutate()}
            disabled={recalculate.isPending}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-[8px] border-[1.5px] border-neutral-200 bg-white px-4 text-sm font-medium text-neutral-900 hover:border-brand hover:text-brand disabled:opacity-60"
          >
            <RefreshCw className={recalculate.isPending ? 'h-4 w-4 animate-spin' : 'h-4 w-4'} />
            Recalcular
          </button>
          <button
            type="button"
            onClick={() => setCreating(true)}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-[8px] bg-brand px-4 text-sm font-medium text-white hover:bg-brand-dark"
          >
            <Plus className="h-4 w-4" />
            Nova imobiliária
          </button>
        </div>
      </div>

      <SummaryCards summary={summary.data} isLoading={summary.isLoading} />

      <div className="flex flex-col gap-2 sm:flex-row">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Buscar por nome ou slug"
            aria-label="Buscar imobiliária"
            className={`${inputClassName} pl-9`}
          />
        </div>
        <select
          value={status}
          onChange={(event) => setStatus(event.target.value)}
          aria-label="Filtrar por situação"
          className={`${inputClassName} sm:w-48`}
        >
          <option value="">Todas as situações</option>
          {SUBSCRIPTION_STATUSES.map((value) => (
            <option key={value} value={value}>
              {STATUS_META[value].label}
            </option>
          ))}
        </select>
      </div>

      <OrganizationsList rows={organizations.data} isLoading={organizations.isLoading} onOpen={setOpenId} />

      <NewOrganizationDialog open={creating} onOpenChange={setCreating} />
      <OrganizationSheet organizationId={openId} onClose={() => setOpenId(null)} />
    </div>
  )
}
