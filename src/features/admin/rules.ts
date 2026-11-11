import type { Plan } from '@/services/billing.service'

/** Preço de tabela: base mais assento extra acima do incluído (mesma regra do priceFor do backend) */
export function suggestedPrice(plans: Plan[] | undefined, planId: string, seats: number): number | null {
  const plan = plans?.find((item) => item.id === planId)
  if (!plan) return null
  const extra = Math.max(0, seats - plan.seats)
  return Math.round((plan.price + (plan.extraSeatPrice ?? 0) * extra) * 100) / 100
}

/** "1.247,50", "247.5" ou "" → número ou null */
export function parseMoney(value: string): number | null {
  const clean = value.trim().replace(/\s|R\$/g, '')
  if (!clean) return null
  const normalized = clean.includes(',') ? clean.replace(/\./g, '').replace(',', '.') : clean
  const parsed = Number(normalized)
  return Number.isFinite(parsed) ? parsed : null
}

/** 247.5 → "247,50" para o campo */
export function moneyInput(value: number | null | undefined) {
  return value === null || value === undefined ? '' : value.toFixed(2).replace('.', ',')
}

/** yyyy-mm-dd de hoje no fuso local */
export function todayInput() {
  const now = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`
}

/** Assentos: inteiro de 1 a 1000 (texto do campo) */
export function isValidSeats(value: string) {
  return /^\d+$/.test(value.trim()) && Number(value) >= 1 && Number(value) <= 1000
}
