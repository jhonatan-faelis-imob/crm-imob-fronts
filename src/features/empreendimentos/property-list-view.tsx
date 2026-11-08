import { Eye, Pencil, Trash2 } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import type { Property } from '@/types'
import { RESALE_STATUS_META, type ResaleStatus } from './constants'
import { PortalChip } from './portal/portal-chip'
import { portalTypeLabel, usePortalConfig } from './portal/use-portal-config'

export function PropertyListView({
  properties,
  onView,
  onEdit,
  onOpenPortal,
  onDeactivate,
}: {
  properties: Property[]
  onView: (property: Property) => void
  onEdit: (property: Property) => void
  onOpenPortal: (property: Property) => void
  onDeactivate: (property: Property) => void
}) {
  const { data: config } = usePortalConfig()

  return (
    <div className="overflow-x-auto rounded-[16px] border-[0.5px] border-neutral-200 bg-white">
      <table className="w-full min-w-[720px] text-left text-sm">
        <thead>
          <tr className="border-b-[0.5px] border-neutral-200 text-xs font-medium text-neutral-400">
            <th className="px-4 py-3">Cód.</th>
            <th className="px-4 py-3">Imóvel</th>
            <th className="hidden px-4 py-3 md:table-cell">Localização</th>
            <th className="hidden px-4 py-3 md:table-cell">Detalhes</th>
            <th className="px-4 py-3">Valor</th>
            <th className="hidden px-4 py-3 lg:table-cell">Responsável</th>
            <th className="px-4 py-3">Status</th>
            <th className="px-4 py-3">Portais</th>
            <th className="px-4 py-3">Ações</th>
          </tr>
        </thead>
        <tbody>
          {properties.map((property, index) => {
            const status = RESALE_STATUS_META[property.status as ResaleStatus]
            return (
              <tr
                key={property.id}
                className={`border-b-[0.5px] border-neutral-200 last:border-0 ${
                  index % 2 === 1 ? 'bg-neutral-100/50' : 'bg-white'
                }`}
              >
                <td className="whitespace-nowrap px-4 py-3 font-mono text-xs text-neutral-600">
                  {property.code ?? <span className="font-sans text-neutral-400">Sem código</span>}
                </td>
                <td className="px-4 py-3">
                  <button
                    type="button"
                    onClick={() => onView(property)}
                    className="text-left font-medium text-neutral-900 hover:text-brand"
                  >
                    {property.title}
                  </button>
                  <p className="text-xs text-neutral-400">
                    {portalTypeLabel(config, property.propertyType) ?? '—'}
                  </p>
                </td>
                <td className="hidden px-4 py-3 text-neutral-600 md:table-cell">
                  {property.neighborhood ? `${property.neighborhood}, ` : ''}
                  {property.city}
                </td>
                <td className="hidden px-4 py-3 text-neutral-600 md:table-cell">
                  {property.bedrooms ?? 0} qts · {property.parkingSpots ?? 0} vagas · {property.areaM2 ?? property.lotAreaM2 ?? 0}m²
                </td>
                <td className="px-4 py-3 font-medium text-neutral-900">
                  {formatCurrency(property.price ?? 0)}
                </td>
                <td className="hidden px-4 py-3 text-neutral-600 lg:table-cell">{property.ownerName}</td>
                <td className="px-4 py-3">
                  <span
                    className="rounded-full px-2.5 py-1 text-xs font-medium"
                    style={{ backgroundColor: status.bg, color: status.text }}
                  >
                    {status.label}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <PortalChip property={property} onOpen={() => onOpenPortal(property)} />
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      aria-label="Ver imóvel"
                      onClick={() => onView(property)}
                      className="rounded-[8px] p-1.5 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-900"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      aria-label="Editar imóvel"
                      onClick={() => onEdit(property)}
                      className="rounded-[8px] p-1.5 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-900"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      aria-label="Desativar imóvel"
                      onClick={() => onDeactivate(property)}
                      className="rounded-[8px] p-1.5 text-neutral-400 hover:bg-danger-bg hover:text-danger"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
