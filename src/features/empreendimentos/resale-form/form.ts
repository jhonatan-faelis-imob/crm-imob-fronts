import { z } from 'zod'
import type { Property } from '@/types'
import { parseCurrency } from '../api'
import { RESALE_STATUSES, type ResaleStatus } from '../constants'
import type {
  AiDescribeRequest,
  PortalConfig,
  PortalPropertyType,
  PortalReadinessDraft,
  PortalReadinessKey,
} from '../portal/types'

export const RESALE_TABS = [
  { key: 'basic', label: 'Básico' },
  { key: 'address', label: 'Endereço' },
  { key: 'features', label: 'Características' },
  { key: 'portal', label: 'Descrição e portais' },
] as const

export const PORTAL_TAB_INDEX = 3

export type TriState = '' | 'sim' | 'nao'

const HTML_TAG = /<[^>]*>/
const MAX_YEAR = new Date().getFullYear() + 5

export const resaleFormSchema = z
  .object({
    propertyType: z.string(),
    code: z.string().max(20, 'Até 20 caracteres'),
    title: z.string().max(100, 'O título aceita no máximo 100 caracteres'),
    price: z.string(),
    status: z.enum(RESALE_STATUSES),
    ownerId: z.string(),
    sellerLeadId: z.string(),
    sellerLeadName: z.string(),
    minIncome: z.string(),
    maxIncome: z.string(),
    cep: z.string(),
    address: z.string(),
    streetNumber: z.string().max(20, 'Até 20 caracteres'),
    complement: z.string().max(100, 'Até 100 caracteres'),
    neighborhood: z.string(),
    city: z.string(),
    state: z.string().max(2, 'Use a sigla com 2 letras'),
    /** O ViaCEP não trouxe o bairro: ele passa a ser obrigatório */
    requireNeighborhood: z.boolean(),
    portalAddressDisplay: z.enum(['full', 'street', 'neighborhood']),
    areaM2: z.string(),
    lotAreaM2: z.string(),
    bedrooms: z.string(),
    suites: z.string(),
    bathrooms: z.string(),
    parkingSpots: z.string(),
    unitFloor: z.string(),
    buildingFloors: z.string(),
    yearBuilt: z.string(),
    condoFee: z.string(),
    iptuValue: z.string(),
    iptuPeriod: z.enum(['', 'anual', 'mensal']),
    features: z.array(z.string()).max(30, 'No máximo 30 características'),
    description: z
      .string()
      .max(3000, 'A descrição aceita no máximo 3.000 caracteres')
      .refine((value) => !HTML_TAG.test(value), 'A descrição não pode conter HTML'),
    acceptsFgts: z.enum(['', 'sim', 'nao']),
    acceptsFinancing: z.enum(['', 'sim', 'nao']),
    exclusive: z.boolean(),
    commissionPct: z.string(),
    internalNotes: z.string().max(2000, 'Até 2.000 caracteres'),
    publishToPortals: z.boolean(),
  })
  .superRefine((values, ctx) => {
    const year = parseInteger(values.yearBuilt)
    if (year !== undefined && (year < 1800 || year > MAX_YEAR)) {
      ctx.addIssue({ code: 'custom', path: ['yearBuilt'], message: `Use um ano entre 1800 e ${MAX_YEAR}` })
    }
    const commission = parseDecimal(values.commissionPct)
    if (commission !== undefined && commission > 100) {
      ctx.addIssue({ code: 'custom', path: ['commissionPct'], message: 'Até 100%' })
    }
    if (values.state && !/^[A-Za-z]{2}$/.test(values.state)) {
      ctx.addIssue({ code: 'custom', path: ['state'], message: 'Use a sigla com 2 letras' })
    }
  })

export type ResaleFormValues = z.infer<typeof resaleFormSchema>
export type ResaleFieldName = keyof ResaleFormValues

export const resaleDefaultValues: ResaleFormValues = {
  propertyType: '',
  code: '',
  title: '',
  price: '',
  status: 'disponivel',
  ownerId: '',
  sellerLeadId: '',
  sellerLeadName: '',
  minIncome: '',
  maxIncome: '',
  cep: '',
  address: '',
  streetNumber: '',
  complement: '',
  neighborhood: '',
  city: '',
  state: '',
  requireNeighborhood: false,
  portalAddressDisplay: 'street',
  areaM2: '',
  lotAreaM2: '',
  bedrooms: '',
  suites: '',
  bathrooms: '',
  parkingSpots: '',
  unitFloor: '',
  buildingFloors: '',
  yearBuilt: '',
  condoFee: '',
  iptuValue: '',
  iptuPeriod: '',
  features: [],
  description: '',
  acceptsFgts: '',
  acceptsFinancing: '',
  exclusive: false,
  commissionPct: '',
  internalNotes: '',
  publishToPortals: false,
}

/** Aba de cada campo: erros e pendências acendem o ponto da aba certa */
export const FIELD_TAB: Record<ResaleFieldName, number> = {
  propertyType: 0,
  code: 0,
  title: 0,
  price: 0,
  status: 0,
  ownerId: 0,
  sellerLeadId: 0,
  sellerLeadName: 0,
  minIncome: 0,
  maxIncome: 0,
  cep: 1,
  address: 1,
  streetNumber: 1,
  complement: 1,
  neighborhood: 1,
  city: 1,
  state: 1,
  requireNeighborhood: 1,
  portalAddressDisplay: 1,
  areaM2: 2,
  lotAreaM2: 2,
  bedrooms: 2,
  suites: 2,
  bathrooms: 2,
  parkingSpots: 2,
  unitFloor: 2,
  buildingFloors: 2,
  yearBuilt: 2,
  condoFee: 2,
  iptuValue: 2,
  iptuPeriod: 2,
  features: 2,
  description: 3,
  acceptsFgts: 3,
  acceptsFinancing: 3,
  exclusive: 3,
  commissionPct: 3,
  internalNotes: 3,
  publishToPortals: 3,
}

export const READINESS_TAB: Record<PortalReadinessKey, number> = {
  propertyType: 0,
  title: 0,
  price: 0,
  cep: 1,
  state: 1,
  city: 1,
  neighborhood: 1,
  area: 2,
  bedrooms: 2,
  bathrooms: 2,
  description: 3,
  photos: 3,
}

/** Campo a focar quando o item do checklist é clicado */
export const READINESS_FIELD: Record<PortalReadinessKey, ResaleFieldName | null> = {
  propertyType: 'propertyType',
  title: 'title',
  price: 'price',
  cep: 'cep',
  state: 'state',
  city: 'city',
  neighborhood: 'neighborhood',
  area: null,
  bedrooms: 'bedrooms',
  bathrooms: 'bathrooms',
  description: 'description',
  photos: null,
}

// ---- Conversões ----

// "1.250,5" (pt-BR) ou "60.5" (sem vírgula, ponto como decimal)
function parseDecimal(value: string): number | undefined {
  const trimmed = value.trim()
  const normalized = trimmed.includes(',') ? trimmed.replace(/\./g, '').replace(',', '.') : trimmed
  if (normalized === '') return undefined
  const parsed = Number(normalized)
  return Number.isFinite(parsed) ? parsed : undefined
}

function parseInteger(value: string): number | undefined {
  const parsed = parseDecimal(value)
  return parsed === undefined ? undefined : Math.trunc(parsed)
}

function toCurrencyMaskValue(value: number | undefined) {
  if (value === undefined) return ''
  return `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function toText(value: number | undefined) {
  return value === undefined ? '' : String(value).replace('.', ',')
}

function toTri(value: boolean | undefined): TriState {
  if (value === true) return 'sim'
  if (value === false) return 'nao'
  return ''
}

function fromTri(value: TriState): boolean | null {
  if (value === 'sim') return true
  if (value === 'nao') return false
  return null
}

export function propertyToResaleValues(property: Property): ResaleFormValues {
  return {
    ...resaleDefaultValues,
    propertyType: property.propertyType ?? '',
    code: property.code ?? '',
    title: property.title,
    price: toCurrencyMaskValue(property.price),
    status: (RESALE_STATUSES as readonly string[]).includes(property.status)
      ? (property.status as ResaleStatus)
      : 'disponivel',
    ownerId: property.ownerId,
    sellerLeadId: property.sellerLeadId ?? '',
    sellerLeadName: property.sellerLeadName ?? '',
    minIncome: toCurrencyMaskValue(property.minIncome),
    maxIncome: toCurrencyMaskValue(property.maxIncome),
    cep: property.cep ?? '',
    address: property.address ?? '',
    streetNumber: property.streetNumber ?? '',
    complement: property.complement ?? '',
    neighborhood: property.neighborhood ?? '',
    city: property.city,
    state: property.state ?? '',
    portalAddressDisplay: property.portalAddressDisplay ?? 'street',
    areaM2: toText(property.areaM2),
    lotAreaM2: toText(property.lotAreaM2),
    bedrooms: toText(property.bedrooms),
    suites: toText(property.suites),
    bathrooms: toText(property.bathrooms),
    parkingSpots: toText(property.parkingSpots),
    unitFloor: toText(property.unitFloor),
    buildingFloors: toText(property.buildingFloors),
    yearBuilt: toText(property.yearBuilt),
    condoFee: toCurrencyMaskValue(property.condoFee),
    iptuValue: toCurrencyMaskValue(property.iptuValue),
    iptuPeriod: property.iptuPeriod ?? '',
    features: property.features ?? [],
    description: property.description ?? '',
    acceptsFgts: toTri(property.acceptsFgts),
    acceptsFinancing: toTri(property.acceptsFinancing),
    exclusive: property.exclusive ?? false,
    commissionPct: toText(property.commissionPct),
    internalNotes: property.internalNotes ?? '',
    publishToPortals: property.publishToPortals ?? false,
  }
}

/** Quartos considerando a regra do tipo (kitnet vazio vale 0; campo escondido não conta) */
function bedroomsFor(values: ResaleFormValues, type: PortalPropertyType | undefined) {
  if (type?.bedrooms === 'hidden') return undefined
  const parsed = parseInteger(values.bedrooms)
  return parsed ?? type?.bedroomsDefault ?? undefined
}

function bathroomsFor(values: ResaleFormValues, type: PortalPropertyType | undefined) {
  if (type?.bathrooms === 'hidden') return undefined
  return parseInteger(values.bathrooms)
}

export function resaleReadinessDraft(values: ResaleFormValues, type: PortalPropertyType | undefined): PortalReadinessDraft {
  return {
    propertyType: values.propertyType || undefined,
    title: values.title,
    description: values.description,
    price: parseCurrency(values.price),
    cep: values.cep,
    state: values.state,
    city: values.city,
    neighborhood: values.neighborhood,
    areaM2: parseDecimal(values.areaM2),
    lotAreaM2: parseDecimal(values.lotAreaM2),
    bedrooms: bedroomsFor(values, type),
    bathrooms: bathroomsFor(values, type),
  }
}

export function resaleAiRequest(values: ResaleFormValues, type: PortalPropertyType | undefined): AiDescribeRequest {
  const isLot = type?.area === 'lot'
  return {
    propertyType: values.propertyType,
    neighborhood: values.neighborhood.trim(),
    city: values.city.trim(),
    areaM2: isLot ? undefined : parseDecimal(values.areaM2),
    lotAreaM2: isLot ? parseDecimal(values.lotAreaM2) : undefined,
    bedrooms: bedroomsFor(values, type),
    suites: type?.bedrooms === 'hidden' ? undefined : parseInteger(values.suites),
    bathrooms: bathroomsFor(values, type),
    parkingSpots: parseInteger(values.parkingSpots),
    unitFloor: type?.floors ? parseInteger(values.unitFloor) : undefined,
    yearBuilt: parseInteger(values.yearBuilt),
    features: values.features.length > 0 ? values.features : undefined,
    acceptsFgts: fromTri(values.acceptsFgts) ?? undefined,
    acceptsFinancing: fromTri(values.acceptsFinancing) ?? undefined,
  }
}

function textOrNull(value: string) {
  const trimmed = value.trim()
  return trimmed === '' ? null : trimmed
}

function numberOrNull(value: number | undefined) {
  return value === undefined ? null : value
}

/** Corpo do POST/PATCH. Campo vazio vai como null para limpar o que estava salvo */
export function resaleFormToDto(values: ResaleFormValues, config: PortalConfig | undefined): Record<string, unknown> {
  const type = config?.types.find((item) => item.value === values.propertyType)
  const showRooms = (rule: string | undefined) => rule !== 'hidden'
  return {
    kind: 'revenda',
    // Vazio: automático no cadastro, mantém o atual na edição
    code: values.code.trim() || undefined,
    propertyType: values.propertyType,
    title: values.title.trim(),
    price: parseCurrency(values.price) ?? null,
    propertyStatus: values.status,
    ownerId: values.ownerId || undefined,
    sellerLeadId: values.sellerLeadId || null,
    minIncome: parseCurrency(values.minIncome) ?? null,
    maxIncome: parseCurrency(values.maxIncome) ?? null,
    cep: textOrNull(values.cep),
    address: textOrNull(values.address),
    streetNumber: textOrNull(values.streetNumber),
    complement: textOrNull(values.complement),
    neighborhood: textOrNull(values.neighborhood),
    city: values.city.trim(),
    state: textOrNull(values.state.toUpperCase()),
    portalAddressDisplay: values.portalAddressDisplay,
    areaM2: numberOrNull(parseDecimal(values.areaM2)),
    lotAreaM2: numberOrNull(parseDecimal(values.lotAreaM2)),
    bedrooms: showRooms(type?.bedrooms) ? numberOrNull(bedroomsFor(values, type)) : null,
    suites: showRooms(type?.bedrooms) ? numberOrNull(parseInteger(values.suites)) : null,
    bathrooms: showRooms(type?.bathrooms) ? numberOrNull(parseInteger(values.bathrooms)) : null,
    parkingSpots: numberOrNull(parseInteger(values.parkingSpots)),
    unitFloor: type?.floors ? numberOrNull(parseInteger(values.unitFloor)) : null,
    buildingFloors: type?.floors ? numberOrNull(parseInteger(values.buildingFloors)) : null,
    yearBuilt: numberOrNull(parseInteger(values.yearBuilt)),
    condoFee: parseCurrency(values.condoFee) ?? null,
    iptuValue: parseCurrency(values.iptuValue) ?? null,
    iptuPeriod: values.iptuPeriod || null,
    features: values.features,
    description: textOrNull(values.description),
    acceptsFgts: fromTri(values.acceptsFgts),
    acceptsFinancing: fromTri(values.acceptsFinancing),
    exclusive: values.exclusive,
    commissionPct: values.exclusive ? numberOrNull(parseDecimal(values.commissionPct)) : null,
    internalNotes: textOrNull(values.internalNotes),
    publishToPortals: values.publishToPortals,
  }
}

/** Mínimo do cadastro rápido: título (3+), tipo, cidade e valor > 0 (e bairro, se o CEP não trouxe) */
export function resaleSaveBlocker(values: ResaleFormValues): { message: string; tab: number } | null {
  if (values.propertyType === '') return { message: 'Escolha o tipo do imóvel', tab: 0 }
  if (values.title.trim().length < 3) return { message: 'Informe um título com pelo menos 3 caracteres', tab: 0 }
  if (!(parseCurrency(values.price) ?? 0)) return { message: 'Informe o valor do imóvel', tab: 0 }
  if (values.city.trim() === '') return { message: 'Informe a cidade', tab: 1 }
  if (values.requireNeighborhood && values.neighborhood.trim() === '') return { message: 'Informe o bairro', tab: 1 }
  return null
}
