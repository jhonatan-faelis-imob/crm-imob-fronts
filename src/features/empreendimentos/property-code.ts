import { isAxiosError } from 'axios'

// Código do imóvel no front. As regras valem no backend (normalizePropertyCode); aqui só ajudamos a digitar.

export const PROPERTY_CODE_MAX = 20
export const PROPERTY_CODE_HELP = 'Deixe em branco para gerar sozinho, ou digite o seu (ex.: CS-01, AP-01).'
export const CODE_CHANGED_WARNING =
  'O código mudou. Se for usado como identificador nos portais, o anúncio pode ser tratado como novo.'

/** Maiúsculas, sem espaços nem caracteres fora de A-Z 0-9 - _ . / (começando por letra ou número) */
export function sanitizePropertyCodeInput(value: string) {
  return value
    .toUpperCase()
    .replace(/[^A-Z0-9._/-]/g, '')
    .replace(/^[._/-]+/, '')
    .slice(0, PROPERTY_CODE_MAX)
}

/** "[CS-01] Casa na praia" nos seletores; sem código, só o título */
export function propertyLabel(title: string, code: string | null | undefined) {
  return code ? `[${code}] ${title}` : title
}

/** Erro do servidor que pertence ao campo de código: 409 (código em uso) ou 400 de formato */
export function codeErrorFrom(error: unknown): string | null {
  if (!isAxiosError(error)) return null
  const status = error.response?.status
  const data: unknown = error.response?.data
  const message =
    typeof data === 'object' && data !== null && typeof (data as { message?: unknown }).message === 'string'
      ? (data as { message: string }).message
      : null
  if (!message) return null
  if (status === 409 && message.startsWith('Código')) return message
  if (status === 400 && message.startsWith('Use letras, números')) return message
  return null
}
