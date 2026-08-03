export type PeriodPreset = 'mes' | 'trimestre' | 'ano' | 'personalizado'

export interface PeriodFilter {
  preset: PeriodPreset
  startDate: string
  endDate: string
}

export type VgvGranularity = 'month' | 'day'
export type RankingMode = 'vgv' | 'quantidade'

export interface PeriodSummary {
  vgv: number
  vgvChangePct: number
  units: number
  unitsChange: number
  ticket: number
  ticketChangePct: number
  commission: number
  commissionChangePct: number
}

export interface VgvPoint {
  label: string
  vgv: number
  units: number
}

export interface DevelopmentSalesEntry {
  id: string
  name: string
  units: number
  vgv: number
}

export interface SourceDistributionEntry {
  source: string
  count: number
  percent: number
}

export interface BrokerRankingEntry {
  id: string
  name: string
  teamName: string
  unitsSold: number
  vgv: number
  commission: number
}

export interface TeamSalesEntry {
  teamId: string
  teamName: string
  realized: number
}

export interface IncomeBracketEntry {
  label: string
  count: number
}
