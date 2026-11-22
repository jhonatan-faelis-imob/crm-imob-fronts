'use client'

import { Trophy } from 'lucide-react'
import { useState } from 'react'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { EmptyState } from '@/components/ui/empty-state'
import { Skeleton } from '@/components/ui/skeleton'
import { formatCurrency, getInitials } from '@/lib/utils'
import type { BrokerRankingEntry, RankingMode } from './types'

const MODE_OPTIONS: { value: RankingMode; label: string }[] = [
  { value: 'vgv', label: 'Por VGV' },
  { value: 'quantidade', label: 'Por quantidade' },
]

export function BrokerRankingTable({ data, isLoading }: { data: BrokerRankingEntry[]; isLoading: boolean }) {
  const [mode, setMode] = useState<RankingMode>('vgv')

  const sorted = [...data].sort((a, b) => (mode === 'vgv' ? b.vgv - a.vgv : b.unitsSold - a.unitsSold))

  return (
    <div className="rounded-[16px] border-[0.5px] border-line bg-paper p-5 lg:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-[20px] font-semibold text-brand">Ranking de corretores</h2>
        <div className="flex items-center gap-1 rounded-[8px] border-[0.5px] border-line bg-paper p-1">
          {MODE_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => setMode(option.value)}
              className={`rounded-[6px] px-3 py-1.5 text-sm font-medium transition-colors ${
                mode === option.value ? 'bg-line text-brand' : 'text-muted-foreground hover:bg-canvas'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <Skeleton className="mt-4 h-64 w-full rounded-[12px]" />
      ) : sorted.length === 0 ? (
        <div className="mt-4">
          <EmptyState
            icon={<Trophy className="h-6 w-6" />}
            title="Nenhuma venda no período"
            description="Assim que houver vendas registradas, o ranking de corretores aparece aqui."
          />
        </div>
      ) : (
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[520px] border-collapse text-sm">
            <thead>
              <tr className="border-b-[0.5px] border-line text-left text-xs font-medium text-muted-foreground">
                <th className="py-2 pr-3">Posição</th>
                <th className="py-2 pr-3">Corretor</th>
                <th className="py-2 pr-3 text-right">Unidades</th>
                <th className="py-2 pr-3 text-right">VGV realizado</th>
                <th className="hidden py-2 pr-3 text-right md:table-cell">Comissão</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((broker, index) => {
                const position = index + 1
                const isFirst = position === 1

                return (
                  <tr
                    key={broker.id}
                    className={`border-b-[0.5px] border-line last:border-0 ${isFirst ? 'bg-[#FFFBEB]' : ''}`}
                  >
                    <td className="py-3 pr-3">
                      <span className="inline-flex items-center gap-1 font-medium text-brand">
                        {isFirst && <Trophy className="h-4 w-4 text-amber-500" />}
                        {position}º
                      </span>
                    </td>
                    <td className="py-3 pr-3">
                      <div className="flex items-center gap-2.5">
                        <Avatar size="sm">
                          <AvatarFallback className="bg-line text-brand">{getInitials(broker.name)}</AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <p className="truncate font-medium text-brand">{broker.name}</p>
                          <p className="truncate text-xs text-muted-foreground">{broker.teamName}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 pr-3 text-right font-medium text-brand">{broker.unitsSold}</td>
                    <td className="py-3 pr-3 text-right font-medium text-brand">{formatCurrency(broker.vgv)}</td>
                    <td className="hidden py-3 pr-3 text-right text-muted-foreground md:table-cell">
                      {formatCurrency(broker.commission)}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
