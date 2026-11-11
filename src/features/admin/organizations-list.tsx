import { Building2, ChevronRight } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { formatDateTime, formatDay, formatMoney, STATUS_META } from '@/features/assinatura/constants'
import { cn } from '@/lib/utils'
import type { AdminOrganizationRow } from '@/services/admin.service'

function StatusBadge({ status }: { status: AdminOrganizationRow['subscriptionStatus'] }) {
  const meta = STATUS_META[status]
  return (
    <span className={cn('inline-block rounded-full px-2.5 py-0.5 text-[11px] font-semibold', meta?.className)}>
      {meta?.label ?? status}
    </span>
  )
}

/** Atrasadas e bloqueadas em destaque */
function highlight(status: string) {
  if (status === 'bloqueada') return 'bg-danger/5'
  if (status === 'atrasada') return 'bg-warning/5'
  return ''
}

function dueDate(row: AdminOrganizationRow) {
  return row.subscriptionStatus === 'teste' ? row.trialEndsAt : row.currentPeriodEnd
}

export function OrganizationsList({
  rows,
  isLoading,
  onOpen,
}: {
  rows: AdminOrganizationRow[] | undefined
  isLoading: boolean
  onOpen: (id: string) => void
}) {
  if (isLoading && !rows) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-20 rounded-[16px]" />
        ))}
      </div>
    )
  }
  if (!rows || rows.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 rounded-[16px] border-[0.5px] border-neutral-200 bg-white px-6 py-10 text-center">
        <Building2 className="h-6 w-6 text-neutral-400" />
        <p className="text-sm text-neutral-600">Nenhuma imobiliária encontrada.</p>
      </div>
    )
  }

  return (
    <>
      {/* Celular: cartões */}
      <ul className="space-y-2 lg:hidden">
        {rows.map((row) => (
          <li key={row.id}>
            <button
              type="button"
              onClick={() => onOpen(row.id)}
              className={cn(
                'flex w-full items-center gap-3 rounded-[16px] border-[0.5px] border-neutral-200 bg-white p-4 text-left',
                highlight(row.subscriptionStatus),
              )}
            >
              <div className="min-w-0 flex-1 space-y-1">
                <div className="flex items-center gap-2">
                  <p className="truncate text-[15px] font-semibold text-neutral-900">{row.name}</p>
                  <StatusBadge status={row.subscriptionStatus} />
                </div>
                <p className="text-xs text-neutral-600">
                  {row.planName} · {row.activeUsers}/{row.seats} usuários · {formatMoney(row.monthlyPrice)}
                </p>
                <p className="text-xs text-neutral-400">
                  Vence {formatDay(dueDate(row))} · Último acesso {formatDateTime(row.lastAccessAt)}
                </p>
              </div>
              <ChevronRight className="h-4 w-4 shrink-0 text-neutral-400" />
            </button>
          </li>
        ))}
      </ul>

      {/* Desktop: tabela */}
      <div className="hidden overflow-hidden rounded-[16px] border-[0.5px] border-neutral-200 bg-white lg:block">
        <table className="w-full text-sm">
          <thead className="bg-neutral-100 text-left text-xs text-neutral-600">
            <tr>
              <th className="px-4 py-3 font-medium">Imobiliária</th>
              <th className="px-4 py-3 font-medium">Plano</th>
              <th className="px-4 py-3 font-medium">Usuários</th>
              <th className="px-4 py-3 font-medium">Situação</th>
              <th className="px-4 py-3 text-right font-medium">Valor</th>
              <th className="px-4 py-3 font-medium">Vencimento</th>
              <th className="px-4 py-3 font-medium">Último acesso</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr
                key={row.id}
                onClick={() => onOpen(row.id)}
                className={cn(
                  'cursor-pointer border-t-[0.5px] border-neutral-200 hover:bg-neutral-100',
                  highlight(row.subscriptionStatus),
                )}
              >
                <td className="px-4 py-3">
                  <button type="button" className="text-left font-medium text-neutral-900 hover:text-brand">
                    {row.name}
                  </button>
                  <p className="text-xs text-neutral-400">{row.slug}</p>
                </td>
                <td className="px-4 py-3 text-neutral-600">{row.planName}</td>
                <td className={cn('px-4 py-3', row.activeUsers >= row.seats ? 'text-warning' : 'text-neutral-600')}>
                  {row.activeUsers}/{row.seats}
                </td>
                <td className="px-4 py-3">
                  <StatusBadge status={row.subscriptionStatus} />
                </td>
                <td className="px-4 py-3 text-right text-neutral-900">{formatMoney(row.monthlyPrice)}</td>
                <td className="px-4 py-3 text-neutral-600">{formatDay(dueDate(row))}</td>
                <td className="px-4 py-3 text-neutral-600">{formatDateTime(row.lastAccessAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  )
}
