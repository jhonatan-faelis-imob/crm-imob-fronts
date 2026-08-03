import type { Sale, SaleStatus } from '@/types'
import type {
  BrokerRankingEntry,
  DevelopmentSalesEntry,
  PeriodSummary,
  SourceDistributionEntry,
  TeamSalesEntry,
  VgvPoint,
} from './types'

export interface ApiSale {
  id: string
  organizationId: string
  leadId: string | null
  propertyId: string | null
  brokerId: string | null
  teamId: string | null
  saleValue: string | number
  unitIdentifier: string | null
  commissionPct: string | number | null
  commissionValue: string | number | null
  status: SaleStatus
  soldAt: string
  notes: string | null
  createdAt: string
  lead: { id: string; name: string } | null
  property: { id: string; title: string; kind: string } | null
  broker: { id: string; name: string; avatarUrl: string | null } | null
  team: { id: string; name: string } | null
}

export function mapApiSaleToSale(apiSale: ApiSale): Sale {
  return {
    id: apiSale.id,
    organizationId: apiSale.organizationId,
    leadId: apiSale.leadId ?? undefined,
    leadName: apiSale.lead?.name,
    propertyId: apiSale.propertyId ?? '',
    propertyTitle: apiSale.property?.title ?? 'Imóvel removido',
    brokerId: apiSale.brokerId ?? '',
    brokerName: apiSale.broker?.name ?? 'Corretor removido',
    teamId: apiSale.teamId ?? undefined,
    teamName: apiSale.team?.name,
    saleValue: Number(apiSale.saleValue),
    unitIdentifier: apiSale.unitIdentifier ?? undefined,
    commissionPct: apiSale.commissionPct != null ? Number(apiSale.commissionPct) : undefined,
    commissionValue: apiSale.commissionValue != null ? Number(apiSale.commissionValue) : undefined,
    status: apiSale.status,
    soldAt: apiSale.soldAt,
    notes: apiSale.notes ?? undefined,
    createdAt: apiSale.createdAt,
  }
}

export interface ApiSalesByPeriodPoint {
  period: string
  vgv: number | string
  count: number
}

const MONTH_SHORT = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez']

function formatPeriodLabel(period: string) {
  // "YYYY-MM" (mensal) ou "YYYY-MM-DD" (diário)
  const parts = period.split('-')
  if (parts.length === 2) {
    const [year, month] = parts
    return `${MONTH_SHORT[Number(month) - 1]}/${year.slice(2)}`
  }
  if (parts.length === 3) {
    const [, month, day] = parts
    return `${day}/${month}`
  }
  return period
}

export function mapSalesByPeriod(raw: ApiSalesByPeriodPoint[]): VgvPoint[] {
  return raw.map((point) => ({
    label: formatPeriodLabel(point.period),
    vgv: Number(point.vgv),
    units: point.count,
  }))
}

export interface ApiBrokerRankingEntry {
  position: number
  broker?: { id: string; name: string; avatarUrl: string | null; team: { name: string } | null }
  vgv: number | string
  commission: number | string
  units: number
}

export function mapBrokerRanking(raw: ApiBrokerRankingEntry[]): BrokerRankingEntry[] {
  return raw
    .filter((entry) => entry.broker)
    .map((entry) => ({
      id: entry.broker!.id,
      name: entry.broker!.name,
      teamName: entry.broker!.team?.name ?? 'Sem equipe',
      unitsSold: entry.units,
      vgv: Number(entry.vgv),
      commission: Number(entry.commission),
    }))
}

export interface ApiRawGroupBySale {
  propertyId?: string | null
  teamId?: string | null
  _sum: { saleValue: string | number | null }
  _count: { id: number }
}

export function mapSalesByProperty(
  raw: ApiRawGroupBySale[],
  properties: { id: string; title: string }[],
): DevelopmentSalesEntry[] {
  const titleById = new Map(properties.map((property) => [property.id, property.title]))
  return raw
    .filter((entry) => entry.propertyId)
    .map((entry) => ({
      id: entry.propertyId as string,
      name: titleById.get(entry.propertyId as string) ?? 'Imóvel removido',
      units: entry._count.id,
      vgv: Number(entry._sum.saleValue ?? 0),
    }))
    .sort((a, b) => b.vgv - a.vgv)
}

export function mapSalesByTeam(raw: ApiRawGroupBySale[], teams: { id: string; name: string }[]): TeamSalesEntry[] {
  const nameById = new Map(teams.map((team) => [team.id, team.name]))
  return raw
    .filter((entry) => entry.teamId)
    .map((entry) => ({
      teamId: entry.teamId as string,
      teamName: nameById.get(entry.teamId as string) ?? 'Sem equipe',
      realized: Number(entry._sum.saleValue ?? 0),
    }))
    .sort((a, b) => b.realized - a.realized)
}

export interface ApiSalesSummary {
  totalVgv: number | string
  totalCommission: number | string
  totalSales: number
}

function pctChange(current: number, previous: number): number {
  if (previous > 0) return Math.round(((current - previous) / previous) * 1000) / 10
  return current > 0 ? 100 : 0
}

export function buildPeriodSummary(current: ApiSalesSummary, previous: ApiSalesSummary): PeriodSummary {
  const vgv = Number(current.totalVgv)
  const previousVgv = Number(previous.totalVgv)
  const units = current.totalSales
  const commission = Number(current.totalCommission)
  const previousCommission = Number(previous.totalCommission)
  const ticket = units > 0 ? vgv / units : 0
  const previousTicket = previous.totalSales > 0 ? previousVgv / previous.totalSales : 0

  return {
    vgv,
    vgvChangePct: pctChange(vgv, previousVgv),
    units,
    unitsChange: units - previous.totalSales,
    ticket,
    ticketChangePct: pctChange(ticket, previousTicket),
    commission,
    commissionChangePct: pctChange(commission, previousCommission),
  }
}

export interface ApiLeadsBySource {
  source: string | null
  _count: { id: number }
}

export function mapLeadsBySource(raw: ApiLeadsBySource[]): SourceDistributionEntry[] {
  const withSource = raw.filter((entry) => entry.source)
  const total = withSource.reduce((sum, entry) => sum + entry._count.id, 0)
  return withSource
    .map((entry) => ({
      source: entry.source as string,
      count: entry._count.id,
      percent: total > 0 ? Math.round((entry._count.id / total) * 1000) / 10 : 0,
    }))
    .sort((a, b) => b.count - a.count)
}
