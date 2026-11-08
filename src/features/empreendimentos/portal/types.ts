// Formato de GET /properties/portal-config e POST /properties/portal-readiness.
// As regras vivem no backend (portal.config.ts); o front só lê.

export type FieldRule = 'required' | 'optional' | 'hidden'

export interface PortalPropertyType {
  value: string
  label: string
  vrsync: string | null
  area: 'living' | 'lot'
  bedrooms: FieldRule
  bathrooms: FieldRule
  floors: boolean
  bedroomsMin: number
  bedroomsDefault: number | null
}

export interface PortalConfig {
  types: PortalPropertyType[]
  features: { value: string; label: string }[]
  limits: {
    TITLE_MIN: number
    TITLE_MAX: number
    DESC_MIN: number
    DESC_MAX: number
    PHOTOS_MIN: number
    FEATURES_MAX: number
  }
  iptuPeriods: ('anual' | 'mensal')[]
  addressDisplays: ('full' | 'street' | 'neighborhood')[]
}

export type PortalReadinessKey =
  | 'propertyType'
  | 'title'
  | 'description'
  | 'price'
  | 'cep'
  | 'state'
  | 'city'
  | 'neighborhood'
  | 'area'
  | 'bedrooms'
  | 'bathrooms'
  | 'photos'

export interface PortalReadinessItem {
  key: PortalReadinessKey
  label: string
  ok: boolean | null
  hint: string | null
}

export interface PortalReadiness {
  ready: boolean
  items: PortalReadinessItem[]
  missing: string[]
}

export interface PortalReadinessDraft {
  propertyType?: string
  title?: string
  description?: string
  price?: number
  cep?: string
  state?: string
  city?: string
  neighborhood?: string
  areaM2?: number
  lotAreaM2?: number
  bedrooms?: number
  bathrooms?: number
}

/** Sem rua, número, CEP nem dados do proprietário */
export interface AiDescribeRequest {
  propertyType: string
  neighborhood: string
  city: string
  areaM2?: number
  lotAreaM2?: number
  bedrooms?: number
  suites?: number
  bathrooms?: number
  parkingSpots?: number
  unitFloor?: number
  yearBuilt?: number
  features?: string[]
  acceptsFgts?: boolean
  acceptsFinancing?: boolean
}

export interface AiDescribeResponse {
  title: string
  description: string
}
