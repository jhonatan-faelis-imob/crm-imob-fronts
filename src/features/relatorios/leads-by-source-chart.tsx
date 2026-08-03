'use client'

import { PieChart as PieChartIcon } from 'lucide-react'
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip, type TooltipContentProps } from 'recharts'
import { EmptyState } from '@/components/ui/empty-state'
import { Skeleton } from '@/components/ui/skeleton'
import type { LeadSource } from '@/types'
import { LEAD_SOURCE_META } from './constants'
import type { SourceDistributionEntry } from './types'

const FALLBACK_META = { label: 'Outro', color: '#DDDDDD' }

function sourceMeta(source: string) {
  return LEAD_SOURCE_META[source as LeadSource] ?? FALLBACK_META
}

function SourceTooltip({ active, payload }: TooltipContentProps) {
  if (!active || !payload || payload.length === 0) return null
  const point = payload[0]?.payload as SourceDistributionEntry | undefined
  if (!point) return null
  const meta = sourceMeta(point.source)

  return (
    <div className="rounded-[12px] border-[0.5px] border-neutral-200 bg-white p-3 shadow-lg">
      <p className="text-xs font-medium text-neutral-900">{meta.label}</p>
      <p className="mt-1 text-sm font-semibold text-neutral-900">{point.count} leads</p>
      <p className="text-xs text-neutral-400">{point.percent}% do total</p>
    </div>
  )
}

export function LeadsBySourceChart({ data, isLoading }: { data: SourceDistributionEntry[]; isLoading: boolean }) {
  return (
    <div className="rounded-[16px] border-[0.5px] border-neutral-200 bg-white p-5 lg:p-6">
      <h2 className="text-[20px] font-semibold text-neutral-900">Origem dos leads</h2>

      {isLoading ? (
        <Skeleton className="mt-4 h-56 w-full rounded-[12px]" />
      ) : data.length === 0 ? (
        <div className="mt-4">
          <EmptyState
            icon={<PieChartIcon className="h-6 w-6" />}
            title="Nenhum lead cadastrado"
            description="Cadastre leads com origem definida para ver esta distribuição."
          />
        </div>
      ) : (
        <div className="mt-4 flex flex-col items-center gap-4 sm:flex-row">
          <div className="h-56 w-full shrink-0 sm:w-1/2">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={data} dataKey="count" nameKey="source" innerRadius="60%" outerRadius="90%" paddingAngle={2}>
                  {data.map((entry) => (
                    <Cell key={entry.source} fill={sourceMeta(entry.source).color} stroke="none" />
                  ))}
                </Pie>
                <Tooltip content={SourceTooltip} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <ul className="w-full space-y-2 sm:w-1/2">
            {data.map((entry) => {
              const meta = sourceMeta(entry.source)
              return (
                <li key={entry.source} className="flex items-center justify-between gap-2 text-sm">
                  <span className="flex min-w-0 items-center gap-2">
                    <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: meta.color }} />
                    <span className="truncate text-neutral-900">{meta.label}</span>
                  </span>
                  <span className="shrink-0 text-neutral-400">
                    {entry.percent}% · {entry.count}
                  </span>
                </li>
              )
            })}
          </ul>
        </div>
      )}
    </div>
  )
}
