import { Building2, Home } from 'lucide-react'
import type { ReactNode } from 'react'
import { getStatusMeta, PROPERTY_TYPE_META } from '@/features/empreendimentos/constants'
import { formatCurrency } from '@/lib/utils'
import type { Property } from '@/types'

export function LinkedPropertyCard({
  property,
  compatible,
  action,
}: {
  property: Property
  compatible?: boolean
  action?: ReactNode
}) {
  const status = getStatusMeta(property.status)
  const price = property.price ?? property.startingPrice
  const typeLabel =
    property.kind === 'empreendimento'
      ? 'Empreendimento'
      : property.propertyType
        ? PROPERTY_TYPE_META[property.propertyType]
        : 'Revenda'
  const Icon = property.kind === 'empreendimento' ? Building2 : Home

  return (
    <div className="flex items-center gap-4 rounded-[16px] border-[0.5px] border-neutral-200 bg-white p-4">
      <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-[12px] bg-brand-bg text-brand">
        <Icon className="h-6 w-6" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="truncate text-sm font-medium text-neutral-900">{property.title}</p>
          {compatible && (
            <span className="rounded-full bg-[#E8F5E9] px-2 py-0.5 text-[11px] font-medium text-success">
              Compatível
            </span>
          )}
        </div>
        <p className="text-xs text-neutral-400">
          {typeLabel} · {property.city}
        </p>
        <div className="mt-1 flex flex-wrap items-center gap-2">
          <p className="text-sm font-semibold text-neutral-900">{formatCurrency(price ?? 0)}</p>
          <span
            className="rounded-full px-2 py-0.5 text-[11px] font-medium"
            style={{ backgroundColor: status.bg, color: status.text }}
          >
            {status.label}
          </span>
        </div>
      </div>
      {action}
    </div>
  )
}
