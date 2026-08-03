'use client'

import { Building2 } from 'lucide-react'
import {
  Bar,
  BarChart,
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
import type { DevelopmentSalesEntry } from './types'

function DevelopmentTooltip({ active, payload }: TooltipContentProps) {
  if (!active || !payload || payload.length === 0) return null
  const point = payload[0]?.payload as DevelopmentSalesEntry | undefined
  if (!point) return null

  return (
    <div className="rounded-[12px] border-[0.5px] border-neutral-200 bg-white p-3 shadow-lg">
      <p className="text-xs font-medium text-neutral-900">{point.name}</p>
      <p className="mt-1 text-sm font-semibold text-neutral-900">{point.units} unidades</p>
      <p className="text-xs text-neutral-400">{formatCurrency(point.vgv)} em VGV</p>
    </div>
  )
}

export function SalesByDevelopmentChart({ data, isLoading }: { data: DevelopmentSalesEntry[]; isLoading: boolean }) {
  return (
    <div className="rounded-[16px] border-[0.5px] border-neutral-200 bg-white p-5 lg:p-6">
      <h2 className="text-[20px] font-semibold text-neutral-900">Vendas por empreendimento</h2>

      {isLoading ? (
        <Skeleton className="mt-4 h-72 w-full rounded-[12px]" />
      ) : data.length === 0 ? (
        <div className="mt-4">
          <EmptyState
            icon={<Building2 className="h-6 w-6" />}
            title="Nenhuma venda no período"
            description="Não há vendas vinculadas a empreendimentos neste período."
          />
        </div>
      ) : (
        <div className="mt-4 h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} layout="vertical" margin={{ top: 0, right: 16, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F0F0F0" horizontal={false} />
              <XAxis
                type="number"
                tick={{ fontSize: 12, fill: '#767676' }}
                axisLine={false}
                tickLine={false}
                allowDecimals={false}
              />
              <YAxis
                type="category"
                dataKey="name"
                width={128}
                tick={{ fontSize: 12, fill: '#484848' }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip content={DevelopmentTooltip} cursor={{ fill: '#F7F7F7' }} />
              <Bar dataKey="units" fill="#FF385C" radius={[0, 8, 8, 0]} barSize={20} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  )
}
