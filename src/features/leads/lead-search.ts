// Espelho da busca do backend (crm-imob-api/src/common/utils/phone.ts e LeadsService.findAll), para listas
// filtradas no navegador: nome ou e-mail (contém, sem diferenciar maiúsculas) ou telefone ignorando a máscara

export const MIN_PHONE_SEARCH_DIGITS = 4
const PHONE_LIKE = /^[\d\s()+\-.]+$/

/** Só dígitos, sem o DDI 55 quando sobram 12 ou 13 dígitos */
export function phoneDigits(raw: string | null | undefined) {
  const digits = (raw ?? '').replace(/\D/g, '')
  if ((digits.length === 12 || digits.length === 13) && digits.startsWith('55')) return digits.slice(2)
  return digits
}

/** Dígitos para buscar por telefone (texto com cara de telefone e 4+ dígitos), ou null */
export function phoneSearchDigits(text: string) {
  const value = text.trim()
  if (!PHONE_LIKE.test(value)) return null
  const digits = phoneDigits(value)
  return digits.length >= MIN_PHONE_SEARCH_DIGITS ? digits : null
}

export interface SearchableLead {
  name: string
  email?: string | null
  phone?: string | null
  phone2?: string | null
}

export function leadMatchesSearch(lead: SearchableLead, text: string) {
  const term = text.trim().toLowerCase()
  if (!term) return true
  if (lead.name.toLowerCase().includes(term)) return true
  if (lead.email?.toLowerCase().includes(term)) return true
  const digits = phoneSearchDigits(term)
  if (!digits) return false
  return phoneDigits(lead.phone).includes(digits) || phoneDigits(lead.phone2).includes(digits)
}
