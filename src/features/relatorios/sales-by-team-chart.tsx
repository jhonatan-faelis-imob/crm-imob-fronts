'use client'

import { Users } from 'lucide-react'
import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis, type TooltipContentProps } from 'recharts'
import { EmptyState } from '@/components/ui/empty-state'
import { Skeleton } from '@/components/ui/skeleton'
import { formatCurrency } from '@/lib/utils'
import { TEAM_CHART_COLORS } from './constants'
import type { TeamSalesEntry } from './types'
import { formatCompactCurrency } from './utils'

function TeamTooltip({ active, payload, label }: TooltipContentProps) {
  if (!active || !payload || payload.length === 0) return null
  const point = payload[0]?.payload as TeamSalesEntry | undefined
  if (!point) return null

  return (
    <div className="rounded-[12px] border-[0.5px] border-neutral-200 bg-white p-3 shadow-lg">
      <p className="text-xs font-medium text-neutral-900">{label}</p>
      <p className="mt-1 text-sm font-semibold text-neutral-900">{formatCurrency(point.realized)}</p>
    </div>
  )
}

export function SalesByTeamChart({ data, isLoading }: { data: TeamSalesEntry[]; isLoading: boolean }) {
  return (
    <div className="rounded-[16px] border-[0.5px] border-neutral-200 bg-white p-5 lg:p-6">
      <h2 className="text-[20px] font-semibold text-neutral-900">Vendas por equipe</h2>

      {isLoading ? (
        <Skeleton className="mt-4 h-64 w-full rounded-[12px]" />
      ) : data.length === 0 ? (
        <div className="mt-4">
          <EmptyState
            icon={<Users className="h-6 w-6" />}
            title="Nenhuma venda no período"
            description="Não há vendas vinculadas a equipes neste período."
          />
        </div>
      ) : (
        <div className="mt-4 h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 10, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F0F0F0" vertical={false} />
              <XAxis
                dataKey="teamName"
                tick={{ fontSize: 12, fill: '#767676' }}
                axisLine={{ stroke: '#DDDDDD' }}
                tickLine={false}
              />
              <YAxis
                tickFormatter={formatCompactCurrency}
                tick={{ fontSize: 12, fill: '#767676' }}
                axisLine={false}
                tickLine={false}
                width={56}
              />
              <Tooltip content={TeamTooltip} cursor={{ fill: '#F7F7F7' }} />
              <Bar dataKey="realized" radius={[6, 6, 0, 0]} barSize={28}>
                {data.map((entry, index) => (
                  <Cell key={entry.teamId} fill={TEAM_CHART_COLORS[index % TEAM_CHART_COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  )
}
