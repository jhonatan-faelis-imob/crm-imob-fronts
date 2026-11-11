import { Skeleton } from '@/components/ui/skeleton'
import { formatMoney } from '@/features/assinatura/constants'
import { cn } from '@/lib/utils'
import type { AdminSummary } from '@/services/admin.service'

const cardClassName = 'rounded-[16px] border-[0.5px] border-neutral-200 bg-white p-4'

export function SummaryCards({ summary, isLoading }: { summary: AdminSummary | undefined; isLoading: boolean }) {
  if (isLoading || !summary) {
    return (
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className={cn('h-[88px] rounded-[16px]', i === 4 && 'col-span-2 lg:col-span-1')} />
        ))}
      </div>
    )
  }

  const cards = [
    { label: 'Ativas', value: summary.byStatus.ativa, className: 'text-success' },
    { label: 'Em teste', value: summary.byStatus.teste, className: 'text-info' },
    { label: 'Atrasadas', value: summary.byStatus.atrasada, className: 'text-warning' },
    { label: 'Bloqueadas', value: summary.byStatus.bloqueada, className: 'text-danger' },
  ]

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
      {cards.map((card) => (
        <div key={card.label} className={cardClassName}>
          <p className="text-xs text-neutral-400">{card.label}</p>
          <p className={cn('mt-1 text-[26px] font-semibold', card.className)}>{card.value}</p>
        </div>
      ))}
      <div className={cn(cardClassName, 'col-span-2 lg:col-span-1')}>
        <p className="text-xs text-neutral-400">Receita mensal (ativas)</p>
        <p className="mt-1 text-[22px] font-semibold text-neutral-900">{formatMoney(summary.monthlyRevenue)}</p>
      </div>
    </div>
  )
}
