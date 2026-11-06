import { toLocalISODate } from '@/lib/date'
import type { PeriodFilter } from './types'

export function resolvePeriodRange(filter: PeriodFilter): { startDate: string; endDate: string } {
  const now = new Date()
  if (filter.preset === 'mes') {
    return {
      startDate: toLocalISODate(new Date(now.getFullYear(), now.getMonth(), 1)),
      endDate: toLocalISODate(new Date(now.getFullYear(), now.getMonth() + 1, 0)),
    }
  }
  if (filter.preset === 'trimestre') {
    const quarter = Math.floor(now.getMonth() / 3)
    return {
      startDate: toLocalISODate(new Date(now.getFullYear(), quarter * 3, 1)),
      endDate: toLocalISODate(new Date(now.getFullYear(), quarter * 3 + 3, 0)),
    }
  }
  if (filter.preset === 'ano') {
    return {
      startDate: toLocalISODate(new Date(now.getFullYear(), 0, 1)),
      endDate: toLocalISODate(new Date(now.getFullYear(), 11, 31)),
    }
  }
  return { startDate: filter.startDate, endDate: filter.endDate }
}

export function previousPeriodRange(startDate: string, endDate: string): { startDate: string; endDate: string } {
  // Sem o horário, new Date('YYYY-MM-DD') seria meia-noite UTC: no dia anterior em São Paulo
  const start = new Date(`${startDate}T00:00:00`)
  const end = new Date(`${endDate}T00:00:00`)
  const durationMs = end.getTime() - start.getTime()
  const previousEnd = new Date(start.getTime() - 86400000)
  const previousStart = new Date(previousEnd.getTime() - durationMs)
  return { startDate: toLocalISODate(previousStart), endDate: toLocalISODate(previousEnd) }
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
