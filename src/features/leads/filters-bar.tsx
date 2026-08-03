import { Search, X } from 'lucide-react'
import type { LeadSource, LeadStatus } from '@/types'
import { SOURCE_META, STATUS_META, STATUS_ORDER, STATUS_TERMINAL_ORDER } from './constants'

export interface LeadFilters {
  search: string
  status: LeadStatus | 'todos'
  source: LeadSource | 'todos'
  brokerId: string | 'todos'
}

export const defaultLeadFilters: LeadFilters = {
  search: '',
  status: 'todos',
  source: 'todos',
  brokerId: 'todos',
}

const ALL_STATUSES = [...STATUS_ORDER, ...STATUS_TERMINAL_ORDER]

const selectClassName =
  'rounded-[8px] border-[1.5px] border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900 outline-none focus:border-brand'

export function FiltersBar({
  filters,
  onChange,
  brokers,
}: {
  filters: LeadFilters
  onChange: (filters: LeadFilters) => void
  brokers: { id: string; name: string }[]
}) {
  const hasActiveFilters =
    filters.search !== '' ||
    filters.status !== 'todos' ||
    filters.source !== 'todos' ||
    filters.brokerId !== 'todos'

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
      <div className="relative flex-1 sm:min-w-[220px]">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
        <input
          type="text"
          value={filters.search}
          onChange={(event) => onChange({ ...filters, search: event.target.value })}
          placeholder="Buscar por nome ou telefone"
          className="w-full rounded-[8px] border-[1.5px] border-neutral-200 bg-white py-2 pl-9 pr-3 text-sm text-neutral-900 outline-none placeholder:text-neutral-400 focus:border-brand"
        />
      </div>

      <select
        value={filters.status}
        onChange={(event) =>
          onChange({ ...filters, status: event.target.value as LeadFilters['status'] })
        }
        className={selectClassName}
      >
        <option value="todos">Todas as etapas</option>
        {ALL_STATUSES.map((status) => (
          <option key={status} value={status}>
            {STATUS_META[status].label}
          </option>
        ))}
      </select>

      <select
        value={filters.source}
        onChange={(event) =>
          onChange({ ...filters, source: event.target.value as LeadFilters['source'] })
        }
        className={selectClassName}
      >
        <option value="todos">Todas as origens</option>
        {(Object.keys(SOURCE_META) as LeadSource[]).map((source) => (
          <option key={source} value={source}>
            {SOURCE_META[source].label}
          </option>
        ))}
      </select>

      <select
        value={filters.brokerId}
        onChange={(event) => onChange({ ...filters, brokerId: event.target.value })}
        className={selectClassName}
      >
        <option value="todos">Todos os responsáveis</option>
        {brokers.map((broker) => (
          <option key={broker.id} value={broker.id}>
            {broker.name}
          </option>
        ))}
      </select>

      {hasActiveFilters && (
        <button
          type="button"
          onClick={() => onChange(defaultLeadFilters)}
          className="flex items-center gap-1.5 rounded-[8px] px-3 py-2 text-sm font-medium text-neutral-600 hover:bg-neutral-100"
        >
          <X className="h-4 w-4" />
          Limpar filtros
        </button>
      )}
    </div>
  )
}
