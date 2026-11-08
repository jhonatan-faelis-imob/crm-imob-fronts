// Funções puras de formatação, usadas no "Ver imóvel", no painel de compartilhar e na página pública /i/.
// Sem React e sem browser: rodam também no servidor.

export const BUSINESS_TIME_ZONE = 'America/Sao_Paulo'

/** Hora atual em São Paulo (0–23), independente do fuso do aparelho */
export function saoPauloHour(now: Date = new Date()) {
  const hour = Number(
    new Intl.DateTimeFormat('en-US', { hour: 'numeric', hourCycle: 'h23', timeZone: BUSINESS_TIME_ZONE }).format(now),
  )
  return hour % 24
}

export function greetingFor(hour: number) {
  if (hour < 12) return 'Bom dia'
  return hour < 18 ? 'Boa tarde' : 'Boa noite'
}

/** Primeiro nome com inicial maiúscula ("joão silva" → "João") */
export function firstName(name: string) {
  const first = name.trim().split(/\s+/)[0] ?? ''
  return first.charAt(0).toLocaleUpperCase('pt-BR') + first.slice(1)
}

/** "R$ 250.000" sem centavos quando o valor é inteiro; "R$ 1.250,50" com centavos */
export function formatMoney(value: number) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: Number.isInteger(value) ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(value)
}

export function formatArea(value: number) {
  return `${new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 2 }).format(value)} m²`
}

function plural(count: number, singular: string, pluralForm: string) {
  return `${count} ${count === 1 ? singular : pluralForm}`
}

export interface SpecsInput {
  livingArea: number | null | undefined
  lotArea: number | null | undefined
  bedrooms: number | null | undefined
  suites: number | null | undefined
  bathrooms: number | null | undefined
  parking: number | null | undefined
  unitFloor: number | null | undefined
  buildingFloors: number | null | undefined
  yearBuilt: number | null | undefined
}

export type SpecKey = 'livingArea' | 'lotArea' | 'bedrooms' | 'suites' | 'bathrooms' | 'parking' | 'floor' | 'yearBuilt'

/** Só o que está preenchido (zero conta como vazio, exceto em quartos de studio/kitnet, que o corretor vê no cadastro) */
export function specItems(specs: SpecsInput): { key: SpecKey; label: string; value: string }[] {
  const items: { key: SpecKey; label: string; value: string }[] = []
  const has = (value: number | null | undefined): value is number => value !== null && value !== undefined && value > 0

  if (has(specs.livingArea)) items.push({ key: 'livingArea', label: 'Área útil', value: formatArea(specs.livingArea) })
  if (has(specs.lotArea)) items.push({ key: 'lotArea', label: 'Área total', value: formatArea(specs.lotArea) })
  if (has(specs.bedrooms)) items.push({ key: 'bedrooms', label: 'Quartos', value: plural(specs.bedrooms, 'quarto', 'quartos') })
  if (has(specs.suites)) items.push({ key: 'suites', label: 'Suítes', value: plural(specs.suites, 'suíte', 'suítes') })
  if (has(specs.bathrooms)) {
    items.push({ key: 'bathrooms', label: 'Banheiros', value: plural(specs.bathrooms, 'banheiro', 'banheiros') })
  }
  if (has(specs.parking)) items.push({ key: 'parking', label: 'Vagas', value: plural(specs.parking, 'vaga', 'vagas') })
  if (has(specs.unitFloor)) {
    const of = has(specs.buildingFloors) ? ` de ${specs.buildingFloors}` : ''
    items.push({ key: 'floor', label: 'Andar', value: `${specs.unitFloor}º andar${of}` })
  }
  if (has(specs.yearBuilt)) items.push({ key: 'yearBuilt', label: 'Ano', value: `Construído em ${specs.yearBuilt}` })
  return items
}

/** "Aceita FGTS e financiamento", só o que for verdadeiro */
export function acceptsLine(acceptsFgts: boolean | null | undefined, acceptsFinancing: boolean | null | undefined) {
  if (acceptsFgts && acceptsFinancing) return 'Aceita FGTS e financiamento'
  if (acceptsFgts) return 'Aceita FGTS'
  if (acceptsFinancing) return 'Aceita financiamento'
  return null
}

/** "agora", "há 5 min", "há 2 h", "há 3 dias" ou a data */
export function formatRelative(iso: string, now: Date = new Date()) {
  const diff = now.getTime() - new Date(iso).getTime()
  const minutes = Math.floor(diff / 60_000)
  if (minutes < 1) return 'agora'
  if (minutes < 60) return `há ${minutes} min`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `há ${hours} h`
  const days = Math.floor(hours / 24)
  if (days < 30) return `há ${plural(days, 'dia', 'dias')}`
  return formatDate(iso)
}

export function formatDate(iso: string) {
  return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: BUSINESS_TIME_ZONE }).format(
    new Date(iso),
  )
}
