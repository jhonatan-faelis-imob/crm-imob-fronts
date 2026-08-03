'use client'

import { BarChart3 } from 'lucide-react'
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  type TooltipContentProps,
} from 'recharts'
import { EmptyState } from '@/components/ui/empty-state'
import { Skeleton } from '@/components/ui/skeleton'
import { formatCurrency } from '@/lib/utils'
import type { VgvGranularity, VgvPoint } from './types'
import { formatCompactCurrency } from './utils'

const GRANULARITY_OPTIONS: { value: VgvGranularity; label: string }[] = [
  { value: 'month', label: 'Mensal' },
  { value: 'day', label: 'Diário' },
]

function VgvTooltip({ active, payload, label }: TooltipContentProps) {
  if (!active || !payload || payload.length === 0) return null
  const point = payload[0]?.payload as VgvPoint | undefined
  if (!point) return null

  return (
    <div className="rounded-[12px] border-[0.5px] border-neutral-200 bg-white p-3 shadow-lg">
      <p className="text-xs font-medium text-neutral-400">{label}</p>
      <p className="mt-1 text-sm font-semibold text-neutral-900">{formatCurrency(point.vgv)}</p>
      <p className="text-xs text-neutral-400">{point.units} unidades vendidas</p>
    </div>
  )
}

export function VgvEvolutionChart({
  data,
  isLoading,
  granularity,
  onGranularityChange,
}: {
  data: VgvPoint[]
  isLoading: boolean
  granularity: VgvGranularity
  onGranularityChange: (value: VgvGranularity) => void
}) {
  return (
    <div className="rounded-[16px] border-[0.5px] border-neutral-200 bg-white p-5 lg:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-[20px] font-semibold text-neutral-900">Evolução do VGV</h2>
        <div className="flex items-center gap-1 rounded-[8px] border-[0.5px] border-neutral-200 bg-white p-1">
          {GRANULARITY_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => onGranularityChange(option.value)}
              className={`rounded-[6px] px-3 py-1.5 text-sm font-medium transition-colors ${
                granularity === option.value ? 'bg-brand-bg text-brand' : 'text-neutral-400 hover:bg-neutral-100'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <Skeleton className="mt-4 h-72 w-full rounded-[12px]" />
      ) : data.length === 0 ? (
        <div className="mt-4">
          <EmptyState
            icon={<BarChart3 className="h-6 w-6" />}
            title="Nenhuma venda no período"
            description="Não há vendas registradas para calcular a evolução do VGV."
          />
        </div>
      ) : (
        <div className="mt-4 h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 10, right: 8, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="vgvGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#FF385C" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="#FF385C" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#F0F0F0" vertical={false} />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 12, fill: '#767676' }}
                axisLine={{ stroke: '#DDDDDD' }}
                tickLine={false}
              />
              <YAxis
                tickFormatter={formatCompactCurrency}
                tick={{ fontSize: 12, fill: '#767676' }}
                axisLine={false}
                tickLine={false}
                width={64}
              />
              <Tooltip content={VgvTooltip} />
              <Area type="monotone" dataKey="vgv" stroke="#FF385C" strokeWidth={2} fill="url(#vgvGradient)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  )
}
