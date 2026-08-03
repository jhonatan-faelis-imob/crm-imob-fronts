import { BedDouble, Car, Home, MoreVertical, Ruler } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { formatCurrency } from '@/lib/utils'
import type { Property } from '@/types'
import { RESALE_STATUS_META, type ResaleStatus } from './constants'

export function PropertyCard({
  property,
  onEdit,
  onDeactivate,
}: {
  property: Property
  onEdit: () => void
  onDeactivate: () => void
}) {
  const status = RESALE_STATUS_META[property.status as ResaleStatus]

  return (
    <div className="group">
      <div className="relative aspect-[4/3] overflow-hidden rounded-[16px] bg-page">
        <div className="flex h-full w-full items-center justify-center transition-transform duration-200 group-hover:scale-[1.01]">
          <Home className="h-10 w-10 text-neutral-400" strokeWidth={1.5} />
        </div>
        <span
          className="absolute left-3 top-3 rounded-full px-2.5 py-1 text-xs font-medium"
          style={{ backgroundColor: status.bg, color: status.text }}
        >
          {status.label}
        </span>

        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <button
                type="button"
                aria-label="Mais opções"
                className="absolute right-3 top-3 flex h-7 w-7 items-center justify-center rounded-full bg-white/90 text-neutral-600 hover:bg-white"
              />
            }
          >
            <MoreVertical className="h-4 w-4" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={onEdit}>Editar</DropdownMenuItem>
            <DropdownMenuItem variant="destructive" onClick={onDeactivate}>
              Desativar
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="mt-2.5 space-y-1">
        <p className="truncate text-sm font-semibold text-neutral-900">{property.title}</p>

        <p className="truncate text-[13px] text-neutral-400">
          {property.neighborhood ? `${property.neighborhood} · ` : ''}
          {property.city}
        </p>

        <div className="flex items-center gap-3 text-[13px] text-neutral-400">
          <span className="flex items-center gap-1">
            <BedDouble className="h-3.5 w-3.5" />
            {property.bedrooms ?? 0}
          </span>
          <span className="flex items-center gap-1">
            <Car className="h-3.5 w-3.5" />
            {property.parkingSpots ?? 0}
          </span>
          <span className="flex items-center gap-1">
            <Ruler className="h-3.5 w-3.5" />
            {property.areaM2 ?? 0}m²
          </span>
        </div>

        <p className="text-sm font-semibold text-neutral-900">{formatCurrency(property.price ?? 0)}</p>
        <p className="text-xs text-neutral-400">{property.ownerName}</p>
      </div>
    </div>
  )
}
