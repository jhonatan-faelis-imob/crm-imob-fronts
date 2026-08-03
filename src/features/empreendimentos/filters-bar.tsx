import { LayoutGrid, List, Search } from 'lucide-react'
import type { PropertyKind } from '@/types'
import {
  BEDROOM_OPTIONS,
  CITIES,
  DEVELOPMENT_STATUS_META,
  DEVELOPMENT_STATUSES,
  PARKING_OPTIONS,
  PRICE_RANGE_OPTIONS,
  RESALE_STATUS_META,
  RESALE_STATUSES,
} from './constants'

export interface PropertyFilters {
  search: string
  city: string
  status: string
  priceRangeId: string
  bedrooms: string
  parkingSpots: string
}

export const defaultPropertyFilters: PropertyFilters = {
  search: '',
  city: 'todas',
  status: 'todos',
  priceRangeId: 'todas',
  bedrooms: 'todos',
  parkingSpots: 'todos',
}

export type ViewMode = 'grid' | 'list'

const selectClassName =
  'rounded-[8px] border-[1.5px] border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900 outline-none focus:border-brand'

export function FiltersBar({
  kind,
  filters,
  onChange,
  viewMode,
  onViewModeChange,
}: {
  kind: PropertyKind
  filters: PropertyFilters
  onChange: (filters: PropertyFilters) => void
  viewMode: ViewMode
  onViewModeChange: (mode: ViewMode) => void
}) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
      <div className="relative flex-1 sm:min-w-[220px]">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
        <input
          type="text"
          value={filters.search}
          onChange={(event) => onChange({ ...filters, search: event.target.value })}
          placeholder="Buscar por nome ou título"
          className="w-full rounded-[8px] border-[1.5px] border-neutral-200 bg-white py-2 pl-9 pr-3 text-sm text-neutral-900 outline-none placeholder:text-neutral-400 focus:border-brand"
        />
      </div>

      <select
        value={filters.city}
        onChange={(event) => onChange({ ...filters, city: event.target.value })}
        className={selectClassName}
      >
        <option value="todas">Todas as cidades</option>
        {CITIES.map((city) => (
          <option key={city} value={city}>
            {city}
          </option>
        ))}
      </select>

      <select
        value={filters.status}
        onChange={(event) => onChange({ ...filters, status: event.target.value })}
        className={selectClassName}
      >
        <option value="todos">Todos os status</option>
        {kind === 'empreendimento'
          ? DEVELOPMENT_STATUSES.map((status) => (
              <option key={status} value={status}>
                {DEVELOPMENT_STATUS_META[status].label}
              </option>
            ))
          : RESALE_STATUSES.map((status) => (
              <option key={status} value={status}>
                {RESALE_STATUS_META[status].label}
              </option>
            ))}
      </select>

      {kind === 'empreendimento' ? (
        <select
          value={filters.priceRangeId}
          onChange={(event) => onChange({ ...filters, priceRangeId: event.target.value })}
          className={selectClassName}
        >
          {PRICE_RANGE_OPTIONS.map((range) => (
            <option key={range.id} value={range.id}>
              {range.label}
            </option>
          ))}
        </select>
      ) : (
        <>
          <select
            value={filters.bedrooms}
            onChange={(event) => onChange({ ...filters, bedrooms: event.target.value })}
            className={selectClassName}
          >
            <option value="todos">Quartos</option>
            {BEDROOM_OPTIONS.map((count) => (
              <option key={count} value={count}>
                {count}+ quartos
              </option>
            ))}
          </select>

          <select
            value={filters.parkingSpots}
            onChange={(event) => onChange({ ...filters, parkingSpots: event.target.value })}
            className={selectClassName}
          >
            <option value="todos">Vagas</option>
            {PARKING_OPTIONS.map((count) => (
              <option key={count} value={count}>
                {count}+ vagas
              </option>
            ))}
          </select>
        </>
      )}

      {kind === 'revenda' && (
        <div className="flex items-center gap-1 rounded-[8px] border-[0.5px] border-neutral-200 bg-white p-1 sm:ml-auto">
          <button
            type="button"
            aria-label="Visualizar em grade"
            onClick={() => onViewModeChange('grid')}
            className={`rounded-[6px] p-1.5 ${
              viewMode === 'grid' ? 'bg-brand-bg text-brand' : 'text-neutral-400 hover:bg-neutral-100'
            }`}
          >
            <LayoutGrid className="h-4 w-4" />
          </button>
          <button
            type="button"
            aria-label="Visualizar em lista"
            onClick={() => onViewModeChange('list')}
            className={`rounded-[6px] p-1.5 ${
              viewMode === 'list' ? 'bg-brand-bg text-brand' : 'text-neutral-400 hover:bg-neutral-100'
            }`}
          >
            <List className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  )
}
