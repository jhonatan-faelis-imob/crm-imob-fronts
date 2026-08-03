'use client'

import { Wallet } from 'lucide-react'
import { Bar, BarChart, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis, type TooltipContentProps } from 'recharts'
import { EmptyState } from '@/components/ui/empty-state'
import { Skeleton } from '@/components/ui/skeleton'
import type { IncomeBracketEntry } from './types'

const BAR_OPACITIES = [0.35, 0.5, 0.65, 0.8, 1]

function IncomeTooltip({ active, payload }: TooltipContentProps) {
  if (!active || !payload || payload.length === 0) return null
  const point = payload[0]?.payload as IncomeBracketEntry | undefined
  if (!point) return null

  return (
    <div className="rounded-[12px] border-[0.5px] border-neutral-200 bg-white p-3 shadow-lg">
      <p className="text-xs font-medium text-neutral-900">{point.label}</p>
      <p className="mt-1 text-sm font-semibold text-neutral-900">{point.count} clientes</p>
    </div>
  )
}

export function IncomeDistributionChart({ data, isLoading }: { data: IncomeBracketEntry[]; isLoading: boolean }) {
  const hasData = data.some((entry) => entry.count > 0)

  return (
    <div className="rounded-[16px] border-[0.5px] border-neutral-200 bg-white p-5 lg:p-6">
      <h2 className="text-[20px] font-semibold text-neutral-900">Distribuição por faixa de renda</h2>

      {isLoading ? (
        <Skeleton className="mt-4 h-64 w-full rounded-[12px]" />
      ) : !hasData ? (
        <div className="mt-4">
          <EmptyState
            icon={<Wallet className="h-6 w-6" />}
            title="Nenhuma venda no período"
            description="Não há vendas com renda de cliente informada neste período."
          />
        </div>
      ) : (
        <div className="mt-4 h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} layout="vertical" margin={{ top: 0, right: 16, left: 0, bottom: 0 }}>
              <XAxis
                type="number"
                tick={{ fontSize: 12, fill: '#767676' }}
                axisLine={false}
                tickLine={false}
                allowDecimals={false}
              />
              <YAxis
                type="category"
                dataKey="label"
                width={92}
                tick={{ fontSize: 12, fill: '#484848' }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip content={IncomeTooltip} cursor={{ fill: '#F7F7F7' }} />
              <Bar dataKey="count" radius={[0, 8, 8, 0]} barSize={22}>
                {data.map((entry, index) => (
                  <Cell key={entry.label} fill="#FF385C" fillOpacity={BAR_OPACITIES[index % BAR_OPACITIES.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  )
}
