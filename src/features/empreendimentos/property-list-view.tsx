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
    <div className="overflow-x-auto rounded-[16px] border-[0.5px] border-line bg-paper">
      <table className="w-full min-w-[720px] text-left text-sm">
        <thead>
          <tr className="border-b-[0.5px] border-line text-xs font-medium text-muted-foreground">
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
                className={`border-b-[0.5px] border-line last:border-0 ${
                  index % 2 === 1 ? 'bg-canvas/50' : 'bg-paper'
                }`}
              >
                <td className="whitespace-nowrap px-4 py-3 font-mono text-xs text-muted-foreground">
                  {property.code ?? <span className="font-sans text-muted-foreground">Sem código</span>}
                </td>
                <td className="px-4 py-3">
                  <button
                    type="button"
                    onClick={() => onView(property)}
                    className="text-left font-medium text-brand hover:text-brand"
                  >
                    {property.title}
                  </button>
                  <p className="text-xs text-muted-foreground">
                    {portalTypeLabel(config, property.propertyType) ?? '—'}
                  </p>
                </td>
                <td className="hidden px-4 py-3 text-muted-foreground md:table-cell">
                  {property.neighborhood ? `${property.neighborhood}, ` : ''}
                  {property.city}
                </td>
                <td className="hidden px-4 py-3 text-muted-foreground md:table-cell">
                  {property.bedrooms ?? 0} qts · {property.parkingSpots ?? 0} vagas · {property.areaM2 ?? property.lotAreaM2 ?? 0}m²
                </td>
                <td className="px-4 py-3 font-medium text-brand">
                  {formatCurrency(property.price ?? 0)}
                </td>
                <td className="hidden px-4 py-3 text-muted-foreground lg:table-cell">{property.ownerName}</td>
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
                      className="rounded-[8px] p-1.5 text-muted-foreground hover:bg-canvas hover:text-brand"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      aria-label="Editar imóvel"
                      onClick={() => onEdit(property)}
                      className="rounded-[8px] p-1.5 text-muted-foreground hover:bg-canvas hover:text-brand"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      aria-label="Desativar imóvel"
                      onClick={() => onDeactivate(property)}
                      className="rounded-[8px] p-1.5 text-muted-foreground hover:bg-danger-bg hover:text-danger"
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
