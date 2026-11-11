import type { BillingInfo, Plan, SubscribeBillingType } from '@/services/billing.service'

// Regras puras da tela de assinatura (as mesmas do backend: plans.config.ts)

export const MAX_SEATS = 1000

/** Corretor é fixo em 1 usuário; nos outros, de 1 incluído até MAX_SEATS */
export function isFixedSeats(plan: Plan) {
  return plan.maxSeats === 1
}

/** Ajusta a quantidade ao plano: Corretor sempre 1; nos outros, nunca abaixo dos incluídos */
export function clampSeats(plan: Plan, seats: number) {
  if (isFixedSeats(plan)) return 1
  const max = plan.maxSeats ?? MAX_SEATS
  return Math.min(max, Math.max(plan.seats, Math.floor(seats) || plan.seats))
}

/** Preço do plano com usuários adicionais acima dos incluídos */
export function planTotal(plan: Plan, seats: number) {
  const extra = Math.max(0, clampSeats(plan, seats) - plan.seats)
  return Math.round((plan.price + (plan.extraSeatPrice ?? 0) * extra) * 100) / 100
}

/** Quantos usuários precisam ser desativados antes de caber no plano (0 se cabe) */
export function seatsShortfall(activeUsers: number, seats: number) {
  return Math.max(0, activeUsers - seats)
}

export function shortfallMessage(activeUsers: number, seats: number) {
  const missing = seatsShortfall(activeUsers, seats)
  if (missing === 0) return null
  return `Você tem ${activeUsers} usuários ativos. Desative ${missing === 1 ? '1 usuário' : `${missing} usuários`} antes ou escolha mais usuários.`
}

/** Dados de cobrança que faltam para assinar (o backend confere de novo) */
export function missingBillingInfo(info: BillingInfo | null): string[] {
  const missing: string[] = []
  if (!info?.billingName) missing.push('nome ou razão social')
  if (!info?.billingDocument) missing.push('CPF ou CNPJ')
  if (!info?.billingEmail) missing.push('e-mail')
  if (!info?.billingPhone) missing.push('telefone')
  return missing
}

export const BILLING_TYPE_OPTIONS: { value: SubscribeBillingType; label: string; hint: string }[] = [
  { value: 'CREDIT_CARD', label: 'Cartão de crédito', hint: 'Renovação automática todo mês' },
  { value: 'PIX', label: 'PIX', hint: 'Cobrança mensal' },
  { value: 'BOLETO', label: 'Boleto', hint: 'Cobrança mensal' },
]

export const BILLING_TYPE_LABEL: Record<string, string> = {
  CREDIT_CARD: 'Cartão de crédito',
  PIX: 'PIX',
  BOLETO: 'Boleto',
  UNDEFINED: 'A definir',
}

const PAYMENT_STATUS: Record<string, { label: string; className: string }> = {
  PENDING: { label: 'Em aberto', className: 'bg-info/10 text-info' },
  CONFIRMED: { label: 'Confirmada', className: 'bg-success/10 text-success' },
  RECEIVED: { label: 'Paga', className: 'bg-success/10 text-success' },
  RECEIVED_IN_CASH: { label: 'Paga', className: 'bg-success/10 text-success' },
  OVERDUE: { label: 'Vencida', className: 'bg-warning/10 text-warning' },
  REFUNDED: { label: 'Estornada', className: 'bg-neutral-100 text-neutral-600' },
  REFUND_REQUESTED: { label: 'Estorno pedido', className: 'bg-neutral-100 text-neutral-600' },
  REFUND_IN_PROGRESS: { label: 'Estornando', className: 'bg-neutral-100 text-neutral-600' },
  CHARGEBACK_REQUESTED: { label: 'Contestada', className: 'bg-danger/10 text-danger' },
  AWAITING_RISK_ANALYSIS: { label: 'Em análise', className: 'bg-info/10 text-info' },
  DELETED: { label: 'Removida', className: 'bg-neutral-100 text-neutral-400' },
}

export function paymentStatusMeta(status: string) {
  return PAYMENT_STATUS[status] ?? { label: status, className: 'bg-neutral-100 text-neutral-600' }
}

export const PAID_STATUSES = ['CONFIRMED', 'RECEIVED', 'RECEIVED_IN_CASH']
