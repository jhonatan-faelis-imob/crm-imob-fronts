import type { Property } from '@/types'

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

// O backend ainda não guarda tipo de imóvel (propertyType), datas de lançamento/entrega/venda,
// número/complemento de endereço nem observações — esses campos existem só na UI até o
// backend ganhar suporte (mesma limitação já documentada para o cadastro de leads).
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
    sold: property.sold,
    active: property.active,
    createdAt: property.createdAt,
    updatedAt: property.updatedAt,
  }
}

function parseCurrency(value: string | undefined): number | undefined {
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

interface PropertyFormShape {
  details: {
    title: string
    city: string
    neighborhood?: string
    cep?: string
    address?: string
    bedrooms?: string
    bathrooms?: string
    parkingSpots?: string
    areaM2?: string
    price: string
    minIncome?: string
    maxIncome?: string
    ownerId?: string
  }
  status: {
    status: string
    notes?: string
  }
}

export function mapPropertyFormToDto(data: PropertyFormShape): Record<string, unknown> {
  const { details, status } = data
  return {
    kind: 'revenda',
    title: details.title,
    city: details.city,
    neighborhood: details.neighborhood || undefined,
    cep: details.cep || undefined,
    address: details.address || undefined,
    bedrooms: details.bedrooms ? Number(details.bedrooms) : undefined,
    bathrooms: details.bathrooms ? Number(details.bathrooms) : undefined,
    parkingSpots: details.parkingSpots ? Number(details.parkingSpots) : undefined,
    areaM2: details.areaM2 ? Number(details.areaM2) : undefined,
    price: parseCurrency(details.price),
    minIncome: parseCurrency(details.minIncome),
    maxIncome: parseCurrency(details.maxIncome),
    ownerId: details.ownerId || undefined,
    propertyStatus: status.status,
  }
}
