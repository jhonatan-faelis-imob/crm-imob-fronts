import { cache } from 'react'
import { propertySharesService } from '@/services/property-shares.service'
import type { PublicPropertyShare } from '@/types'
import { formatMoney, specItems } from '@/features/empreendimentos/share/share-format'

// Uma busca por requisição, dividida entre generateMetadata, a página e a imagem de prévia
export const loadPublicShare = cache((token: string) => propertySharesService.getPublic(token))

export function priceText(share: PublicPropertyShare) {
  if (share.price === null) return null
  return share.priceLabel === 'a partir de' ? `a partir de ${formatMoney(share.price)}` : formatMoney(share.price)
}

export function placeText(share: PublicPropertyShare) {
  return [share.location.neighborhood, share.location.city].filter(Boolean).join(', ')
}

export function publicSpecs(share: PublicPropertyShare) {
  return specItems(share.specs)
}

/** Descrição curta para a prévia: bairro, cidade e as principais especificações */
export function summaryText(share: PublicPropertyShare) {
  const specs = publicSpecs(share)
    .filter((spec) => ['bedrooms', 'bathrooms', 'parking', 'livingArea', 'lotArea'].includes(spec.key))
    .map((spec) => spec.value)
  return [placeText(share), ...specs].filter(Boolean).join(' · ')
}
