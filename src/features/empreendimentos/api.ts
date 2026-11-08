import type { PortalAddressDisplay, Property } from '@/types'

export interface ApiProperty {
  id: string
  organizationId: string
  ownerId: string | null
  kind: string
  title: string
  description: string | null
  cep: string | null
  address: string | null
  neighborhood: string | null
  city: string
  state: string | null
  totalUnits: number | null
  startingPrice: string | number | null
  maxPrice: string | number | null
  price: string | number | null
  areaM2: string | number | null
  bedrooms: number | null
  bathrooms: number | null
  parkingSpots: number | null
  minIncome: string | number | null
  maxIncome: string | number | null
  propertyStatus: string | null
  propertyType?: string | null
  streetNumber?: string | null
  complement?: string | null
  lotAreaM2?: string | number | null
  suites?: number | null
  unitFloor?: number | null
  buildingFloors?: number | null
  yearBuilt?: number | null
  condoFee?: string | number | null
  iptuValue?: string | number | null
  iptuPeriod?: string | null
  features?: string[]
  acceptsFinancing?: boolean | null
  acceptsFgts?: boolean | null
  exclusive?: boolean
  commissionPct?: string | number | null
  internalNotes?: string | null
  sellerLeadId?: string | null
  sellerLead?: { id: string; name: string; phone: string | null } | null
  publishToPortals?: boolean
  portalAddressDisplay?: string
  portal?: { ready: boolean; missingCount: number } | null
  sold: boolean
  active: boolean
  createdAt: string
  updatedAt: string
  owner?: { id: string; name: string; avatarUrl: string | null } | null
  _count?: { leads: number; sales: number }
}

function toNumber(value: string | number | null | undefined): number | undefined {
  if (value === null || value === undefined) return undefined
  return Number(value)
}

function toBoolean(value: boolean | null | undefined): boolean | undefined {
  return value === null ? undefined : value
}

const ADDRESS_DISPLAYS: PortalAddressDisplay[] = ['full', 'street', 'neighborhood']

// Empreendimentos ainda não guardam datas de lançamento/entrega (só na UI)
export function mapApiPropertyToProperty(property: ApiProperty): Property {
  return {
    id: property.id,
    organizationId: property.organizationId,
    ownerId: property.ownerId ?? '',
    ownerName: property.owner?.name ?? 'Sem responsável',
    kind: property.kind as Property['kind'],
    title: property.title,
    description: property.description ?? undefined,
    cep: property.cep ?? undefined,
    address: property.address ?? undefined,
    neighborhood: property.neighborhood ?? undefined,
    city: property.city,
    state: property.state ?? undefined,
    totalUnits: property.totalUnits ?? undefined,
    soldUnits: property._count?.sales ?? 0,
    startingPrice: toNumber(property.startingPrice),
    maxPrice: toNumber(property.maxPrice),
    price: toNumber(property.price),
    areaM2: toNumber(property.areaM2),
    bedrooms: property.bedrooms ?? undefined,
    bathrooms: property.bathrooms ?? undefined,
    parkingSpots: property.parkingSpots ?? undefined,
    minIncome: toNumber(property.minIncome),
    maxIncome: toNumber(property.maxIncome),
    status: (property.propertyStatus ?? 'lancamento') as Property['status'],
    propertyType: property.propertyType ?? undefined,
    streetNumber: property.streetNumber ?? undefined,
    complement: property.complement ?? undefined,
    lotAreaM2: toNumber(property.lotAreaM2),
    suites: property.suites ?? undefined,
    unitFloor: property.unitFloor ?? undefined,
    buildingFloors: property.buildingFloors ?? undefined,
    yearBuilt: property.yearBuilt ?? undefined,
    condoFee: toNumber(property.condoFee),
    iptuValue: toNumber(property.iptuValue),
    iptuPeriod: property.iptuPeriod === 'anual' || property.iptuPeriod === 'mensal' ? property.iptuPeriod : undefined,
    features: property.features ?? [],
    acceptsFinancing: toBoolean(property.acceptsFinancing),
    acceptsFgts: toBoolean(property.acceptsFgts),
    exclusive: property.exclusive ?? false,
    commissionPct: toNumber(property.commissionPct),
    internalNotes: property.internalNotes ?? undefined,
    sellerLeadId: property.sellerLeadId ?? undefined,
    sellerLeadName: property.sellerLead?.name,
    publishToPortals: property.publishToPortals ?? false,
    portalAddressDisplay: ADDRESS_DISPLAYS.find((value) => value === property.portalAddressDisplay) ?? 'street',
    portal: property.portal ?? undefined,
    sold: property.sold,
    active: property.active,
    createdAt: property.createdAt,
    updatedAt: property.updatedAt,
  }
}

export function parseCurrency(value: string | undefined): number | undefined {
  if (!value) return undefined
  const digits = value.replace(/[^\d,]/g, '').replace(',', '.')
  const parsed = Number(digits)
  return Number.isFinite(parsed) && digits !== '' ? parsed : undefined
}

interface DevelopmentFormShape {
  general: {
    title: string
    city: string
    neighborhood?: string
    cep?: string
    address?: string
    totalUnits?: string
    startingPrice?: string
    maxPrice?: string
    minIncome?: string
    maxIncome?: string
    ownerId?: string
    description?: string
  }
  settings: {
    status: string
  }
}

export function mapDevelopmentFormToDto(data: DevelopmentFormShape): Record<string, unknown> {
  const { general, settings } = data
  return {
    kind: 'empreendimento',
    title: general.title,
    city: general.city,
    neighborhood: general.neighborhood || undefined,
    cep: general.cep || undefined,
    address: general.address || undefined,
    totalUnits: general.totalUnits ? Number(general.totalUnits) : undefined,
    startingPrice: parseCurrency(general.startingPrice),
    maxPrice: parseCurrency(general.maxPrice),
    minIncome: parseCurrency(general.minIncome),
    maxIncome: parseCurrency(general.maxIncome),
    ownerId: general.ownerId || undefined,
    description: general.description || undefined,
    propertyStatus: settings.status,
  }
}
