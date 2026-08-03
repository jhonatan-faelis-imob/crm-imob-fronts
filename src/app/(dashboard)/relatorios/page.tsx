'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { BrokerRankingTable } from '@/features/relatorios/broker-ranking-table'
import { IncomeDistributionChart } from '@/features/relatorios/income-distribution-chart'
import { LeadsBySourceChart } from '@/features/relatorios/leads-by-source-chart'
import { PeriodSelector } from '@/features/relatorios/period-selector'
import { SalesByDevelopmentChart } from '@/features/relatorios/sales-by-development-chart'
import { SalesByTeamChart } from '@/features/relatorios/sales-by-team-chart'
import { SalesHistoryTable } from '@/features/relatorios/sales-history-table'
import { SummaryCards } from '@/features/relatorios/summary-cards'
import type { IncomeBracketEntry, PeriodFilter, VgvGranularity } from '@/features/relatorios/types'
import { VgvEvolutionChart } from '@/features/relatorios/vgv-evolution-chart'
import { previousPeriodRange, resolvePeriodRange } from '@/features/relatorios/utils'
import {
  buildPeriodSummary,
  mapApiSaleToSale,
  mapBrokerRanking,
  mapLeadsBySource,
  mapSalesByPeriod,
  mapSalesByProperty,
  mapSalesByTeam,
  type ApiBrokerRankingEntry,
  type ApiLeadsBySource,
  type ApiRawGroupBySale,
  type ApiSale,
  type ApiSalesByPeriodPoint,
  type ApiSalesSummary,
} from '@/features/relatorios/api'
import { reportsService } from '@/services/reports.service'
import { salesService } from '@/services/sales.service'
import { propertiesService } from '@/services/properties.service'
import { teamsService } from '@/services/teams.service'

interface ApiProperty {
  id: string
  title: string
}

interface ApiTeam {
  id: string
  name: string
}

function todayIso() {
  return new Date().toISOString().slice(0, 10)
}

const defaultPeriodFilter: PeriodFilter = {
  preset: 'mes',
  startDate: todayIso(),
  endDate: todayIso(),
}

export default function RelatoriosPage() {
  const [periodFilter, setPeriodFilter] = useState<PeriodFilter>(defaultPeriodFilter)
  const [granularity, setGranularity] = useState<VgvGranularity>('month')

  const { startDate, endDate } = resolvePeriodRange(periodFilter)
  const previousRange = previousPeriodRange(startDate, endDate)

  const { data: summary, isLoading: isSummaryLoading } = useQuery({
    queryKey: ['reports-summary', startDate, endDate],
    queryFn: async () => {
      const [current, previous] = await Promise.all([
        salesService.getSummary(startDate, endDate) as Promise<ApiSalesSummary>,
        salesService.getSummary(previousRange.startDate, previousRange.endDate) as Promise<ApiSalesSummary>,
      ])
      return buildPeriodSummary(current, previous)
    },
  })

  const { data: vgvEvolution, isLoading: isVgvLoading } = useQuery({
    queryKey: ['reports-sales-by-period', startDate, endDate, granularity],
    queryFn: async () => {
      const raw = (await reportsService.getSalesByPeriod(startDate, endDate, granularity)) as ApiSalesByPeriodPoint[]
      return mapSalesByPeriod(raw)
    },
  })

  const { data: properties } = useQuery({
    queryKey: ['properties-for-reports'],
    queryFn: async () => {
      const result = await propertiesService.findAll({ limit: '100' })
      return (result.data ?? []) as ApiProperty[]
    },
  })

  const { data: salesByDevelopment, isLoading: isDevelopmentLoading } = useQuery({
    queryKey: ['reports-sales-by-property', startDate, endDate],
    queryFn: async () => {
      const raw = (await reportsService.getSalesByProperty(startDate, endDate)) as ApiRawGroupBySale[]
      return mapSalesByProperty(raw, properties ?? [])
    },
    enabled: properties !== undefined,
  })

  const { data: leadsBySource, isLoading: isSourceLoading } = useQuery({
    queryKey: ['reports-leads-by-source'],
    queryFn: async () => {
      const raw = (await reportsService.getLeadsBySource()) as ApiLeadsBySource[]
      return mapLeadsBySource(raw)
    },
  })

  const { data: brokerRanking, isLoading: isRankingLoading } = useQuery({
    queryKey: ['reports-broker-ranking', startDate, endDate],
    queryFn: async () => {
      const raw = (await reportsService.getBrokerRanking(startDate, endDate)) as ApiBrokerRankingEntry[]
      return mapBrokerRanking(raw)
    },
  })

  const { data: teams } = useQuery({
    queryKey: ['teams-for-reports'],
    queryFn: () => teamsService.findAll() as Promise<ApiTeam[]>,
  })

  const { data: salesByTeam, isLoading: isTeamLoading } = useQuery({
    queryKey: ['reports-sales-by-team', startDate, endDate],
    queryFn: async () => {
      const raw = (await reportsService.getSalesByTeam(startDate, endDate)) as ApiRawGroupBySale[]
      return mapSalesByTeam(raw, teams ?? [])
    },
    enabled: teams !== undefined,
  })

  const { data: incomeDistribution, isLoading: isIncomeLoading } = useQuery({
    queryKey: ['reports-sales-by-income-bracket', startDate, endDate],
    queryFn: () => reportsService.getSalesByIncomeBracket(startDate, endDate) as Promise<IncomeBracketEntry[]>,
  })

  const { data: salesHistory, isLoading: isHistoryLoading } = useQuery({
    queryKey: ['sales-history', startDate, endDate],
    queryFn: async () => {
      const result = await salesService.findAll({ startDate, endDate, limit: '100' })
      return ((result.data ?? []) as ApiSale[]).map(mapApiSaleToSale)
    },
  })

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <h1 className="text-[28px] font-semibold text-neutral-900">Relatórios</h1>
        <PeriodSelector
          filter={periodFilter}
          onChange={setPeriodFilter}
          onExport={() => console.log('Exportar relatório', periodFilter)}
        />
      </div>

      <SummaryCards summary={summary} isLoading={isSummaryLoading} />

      <VgvEvolutionChart
        data={vgvEvolution ?? []}
        isLoading={isVgvLoading}
        granularity={granularity}
        onGranularityChange={setGranularity}
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <SalesByDevelopmentChart data={salesByDevelopment ?? []} isLoading={isDevelopmentLoading} />
        <LeadsBySourceChart data={leadsBySource ?? []} isLoading={isSourceLoading} />
      </div>

      <BrokerRankingTable data={brokerRanking ?? []} isLoading={isRankingLoading} />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <SalesByTeamChart data={salesByTeam ?? []} isLoading={isTeamLoading} />
        <IncomeDistributionChart data={incomeDistribution ?? []} isLoading={isIncomeLoading} />
      </div>

      <SalesHistoryTable data={salesHistory ?? []} isLoading={isHistoryLoading} />
    </div>
  )
}
