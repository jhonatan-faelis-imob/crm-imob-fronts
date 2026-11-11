import { whatsappUrl } from '@/lib/whatsapp'
import type { SubscriptionStatus } from '@/services/billing.service'

export const SUBSCRIPTION_STATUSES: SubscriptionStatus[] = ['teste', 'ativa', 'atrasada', 'bloqueada', 'cancelada']

export const STATUS_META: Record<SubscriptionStatus, { label: string; className: string }> = {
  teste: { label: 'Em teste', className: 'bg-info/10 text-info' },
  ativa: { label: 'Ativa', className: 'bg-success/10 text-success' },
  atrasada: { label: 'Atrasada', className: 'bg-warning/10 text-warning' },
  bloqueada: { label: 'Bloqueada', className: 'bg-danger/10 text-danger' },
  cancelada: { label: 'Cancelada', className: 'bg-neutral-100 text-neutral-600' },
}

export function statusLabel(status: string) {
  return STATUS_META[status as SubscriptionStatus]?.label ?? status
}

export const PAYMENT_METHODS = [
  { value: 'pix', label: 'Pix' },
  { value: 'boleto', label: 'Boleto' },
  { value: 'cartao', label: 'Cartão' },
  { value: 'transferencia', label: 'Transferência' },
  { value: 'dinheiro', label: 'Dinheiro' },
  { value: 'outro', label: 'Outro' },
] as const

const money = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })

export function formatMoney(value: number | null | undefined) {
  return value === null || value === undefined ? '—' : money.format(value)
}

/** Datas da assinatura são dias, gravados em UTC: mostra o dia em UTC para não voltar um dia no fuso do Brasil */
export function formatDay(value: string | null | undefined) {
  if (!value) return '—'
  return new Date(value).toLocaleDateString('pt-BR', { timeZone: 'UTC' })
}

export function formatDateTime(value: string | null | undefined) {
  if (!value) return '—'
  return new Date(value).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })
}

/** yyyy-mm-dd para <input type="date"> */
export function toDateInput(value: string | null | undefined) {
  return value ? value.slice(0, 10) : ''
}

export const SUPPORT_PHONE = process.env.NEXT_PUBLIC_SUPPORT_PHONE ?? ''

/** WhatsApp do suporte; null se NEXT_PUBLIC_SUPPORT_PHONE não estiver configurado */
export function supportWhatsappUrl(text = 'Olá! Preciso de ajuda com a assinatura do CRM Imob.') {
  return SUPPORT_PHONE ? whatsappUrl(SUPPORT_PHONE, text) : null
}

// ---------------------------------------------------------------- CPF e CNPJ (mesma regra do backend)

const digitsOf = (value: string) => value.replace(/\D/g, '')

function validCpf(cpf: string) {
  if (cpf.length !== 11 || /^(\d)\1+$/.test(cpf)) return false
  const digit = (length: number) => {
    let sum = 0
    for (let i = 0; i < length; i++) sum += Number(cpf[i]) * (length + 1 - i)
    const rest = (sum * 10) % 11
    return rest === 10 ? 0 : rest
  }
  return digit(9) === Number(cpf[9]) && digit(10) === Number(cpf[10])
}

function validCnpj(cnpj: string) {
  if (cnpj.length !== 14 || /^(\d)\1+$/.test(cnpj)) return false
  const digit = (length: number) => {
    const weights = length === 12 ? [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2] : [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
    const sum = weights.reduce((acc, weight, i) => acc + Number(cnpj[i]) * weight, 0)
    const rest = sum % 11
    return rest < 2 ? 0 : 11 - rest
  }
  return digit(12) === Number(cnpj[12]) && digit(13) === Number(cnpj[13])
}

/** Vazio vale (limpa); preenchido precisa ser CPF ou CNPJ válido */
export function isValidDocumentOrEmpty(value: string) {
  const digits = digitsOf(value)
  if (digits.length === 0) return true
  return digits.length === 11 ? validCpf(digits) : digits.length === 14 ? validCnpj(digits) : false
}

/** Máscara de CPF ou CNPJ conforme a quantidade de dígitos */
export function formatDocument(value: string | null | undefined) {
  const digits = digitsOf(value ?? '')
  if (digits.length === 11) return digits.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
  if (digits.length === 14) return digits.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5')
  return value ?? ''
}
