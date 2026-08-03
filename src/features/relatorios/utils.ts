import type { PeriodFilter } from './types'

function iso(date: Date) {
  return date.toISOString().slice(0, 10)
}

export function resolvePeriodRange(filter: PeriodFilter): { startDate: string; endDate: string } {
  const now = new Date()
  if (filter.preset === 'mes') {
    return {
      startDate: iso(new Date(now.getFullYear(), now.getMonth(), 1)),
      endDate: iso(new Date(now.getFullYear(), now.getMonth() + 1, 0)),
    }
  }
  if (filter.preset === 'trimestre') {
    const quarter = Math.floor(now.getMonth() / 3)
    return {
      startDate: iso(new Date(now.getFullYear(), quarter * 3, 1)),
      endDate: iso(new Date(now.getFullYear(), quarter * 3 + 3, 0)),
    }
  }
  if (filter.preset === 'ano') {
    return {
      startDate: iso(new Date(now.getFullYear(), 0, 1)),
      endDate: iso(new Date(now.getFullYear(), 11, 31)),
    }
  }
  return { startDate: filter.startDate, endDate: filter.endDate }
}

export function previousPeriodRange(startDate: string, endDate: string): { startDate: string; endDate: string } {
  const start = new Date(startDate)
  const end = new Date(endDate)
  const durationMs = end.getTime() - start.getTime()
  const previousEnd = new Date(start.getTime() - 86400000)
  const previousStart = new Date(previousEnd.getTime() - durationMs)
  return { startDate: iso(previousStart), endDate: iso(previousEnd) }
}

export function formatCompactCurrency(value: number) {
  const abs = Math.abs(value)
  if (abs >= 1_000_000) {
    return `R$ ${(value / 1_000_000).toLocaleString('pt-BR', { maximumFractionDigits: 1 })}M`
  }
  if (abs >= 1_000) {
    return `R$ ${(value / 1_000).toLocaleString('pt-BR', { maximumFractionDigits: 0 })}mil`
  }
  return `R$ ${value}`
}

export function formatSignedPercent(value: number) {
  const sign = value > 0 ? '+' : ''
  return `${sign}${value.toLocaleString('pt-BR', { maximumFractionDigits: 1 })}%`
}

export function formatSignedNumber(value: number) {
  const sign = value > 0 ? '+' : ''
  return `${sign}${value}`
}
