import { TrendingDown, TrendingUp } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { formatCurrency } from '@/lib/utils'
import type { PeriodSummary } from './types'
import { formatSignedNumber, formatSignedPercent } from './utils'

function VariationBadge({ value, isPercent }: { value: number; isPercent: boolean }) {
  const positive = value >= 0
  const Icon = positive ? TrendingUp : TrendingDown

  return (
    <span className={`inline-flex items-center gap-1 text-xs font-medium ${positive ? 'text-success' : 'text-danger'}`}>
      <Icon className="h-3 w-3" />
      {isPercent ? formatSignedPercent(value) : formatSignedNumber(value)}
    </span>
  )
}

export function SummaryCards({ summary, isLoading }: { summary: PeriodSummary | undefined; isLoading: boolean }) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-32 rounded-[16px]" />
        ))}
      </div>
    )
  }

  if (!summary) return null

  const cards: { label: string; value: string; variationValue: number; isPercent: boolean }[] = [
    { label: 'VGV total', value: formatCurrency(summary.vgv), variationValue: summary.vgvChangePct, isPercent: true },
    {
      label: 'Unidades vendidas',
      value: String(summary.units),
      variationValue: summary.unitsChange,
      isPercent: false,
    },
    {
      label: 'Ticket médio',
      value: formatCurrency(summary.ticket),
      variationValue: summary.ticketChangePct,
      isPercent: true,
    },
    {
      label: 'Comissão total',
      value: formatCurrency(summary.commission),
      variationValue: summary.commissionChangePct,
      isPercent: true,
    },
  ]

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => (
        <div key={card.label} className="rounded-[16px] border-[0.5px] border-neutral-200 bg-white p-5">
          <p className="text-[13px] text-neutral-400">{card.label}</p>
          <p className="mt-1 text-[28px] font-semibold text-neutral-900">{card.value}</p>
          <div className="mt-2 flex items-center gap-1.5">
            <VariationBadge value={card.variationValue} isPercent={card.isPercent} />
            <span className="text-xs text-neutral-400">vs período anterior</span>
          </div>
        </div>
      ))}
    </div>
  )
}
