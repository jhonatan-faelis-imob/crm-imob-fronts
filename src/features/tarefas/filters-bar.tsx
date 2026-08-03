import { Search } from 'lucide-react'
import type { TaskPriority, TaskType } from '@/types'
import { PRIORITY_META, STATUS_FILTER_META, TASK_PRIORITIES, TASK_STATUSES, TASK_TYPE_META, TASK_TYPES } from './constants'
import { defaultTaskFilters, type TaskFilters } from './types'

const selectClassName =
  'rounded-[8px] border-[1.5px] border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900 outline-none focus:border-brand'

const PERIOD_OPTIONS: { value: TaskFilters['period']; label: string }[] = [
  { value: 'todos', label: 'Qualquer período' },
  { value: 'hoje', label: 'Hoje' },
  { value: 'semana', label: 'Esta semana' },
  { value: 'mes', label: 'Este mês' },
  { value: 'vencidas', label: 'Vencidas' },
  { value: 'personalizado', label: 'Personalizado' },
]

export function FiltersBar({
  filters,
  onChange,
  brokers,
}: {
  filters: TaskFilters
  onChange: (filters: TaskFilters) => void
  brokers: { id: string; name: string }[]
}) {
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-1 rounded-[8px] border-[0.5px] border-neutral-200 bg-white p-1">
        {TASK_STATUSES.map((status) => (
          <button
            key={status}
            type="button"
            onClick={() => onChange({ ...filters, status })}
            className={`rounded-[6px] px-3 py-1.5 text-sm font-medium transition-colors ${
              filters.status === status ? 'bg-brand-bg text-brand' : 'text-neutral-400 hover:bg-neutral-100'
            }`}
          >
            {STATUS_FILTER_META[status]}
          </button>
        ))}
        <button
          type="button"
          onClick={() => onChange({ ...filters, status: 'todas' })}
          className={`rounded-[6px] px-3 py-1.5 text-sm font-medium transition-colors ${
            filters.status === 'todas' ? 'bg-brand-bg text-brand' : 'text-neutral-400 hover:bg-neutral-100'
          }`}
        >
          Todas
        </button>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
        <div className="relative flex-1 sm:min-w-[220px]">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
          <input
            type="text"
            value={filters.search}
            onChange={(event) => onChange({ ...filters, search: event.target.value })}
            placeholder="Buscar por título ou lead"
            className="w-full rounded-[8px] border-[1.5px] border-neutral-200 bg-white py-2 pl-9 pr-3 text-sm text-neutral-900 outline-none placeholder:text-neutral-400 focus:border-brand"
          />
        </div>

        <select
          value={filters.type}
          onChange={(event) => onChange({ ...filters, type: event.target.value as TaskType | 'todos' })}
          className={selectClassName}
        >
          <option value="todos">Todos os tipos</option>
          {TASK_TYPES.map((type) => (
            <option key={type} value={type}>
              {TASK_TYPE_META[type].label}
            </option>
          ))}
        </select>

        <select
          value={filters.priority}
          onChange={(event) => onChange({ ...filters, priority: event.target.value as TaskPriority | 'todas' })}
          className={selectClassName}
        >
          <option value="todas">Todas as prioridades</option>
          {TASK_PRIORITIES.map((priority) => (
            <option key={priority} value={priority}>
              {PRIORITY_META[priority].label}
            </option>
          ))}
        </select>

        <select
          value={filters.assignedTo}
          onChange={(event) => onChange({ ...filters, assignedTo: event.target.value })}
          className={selectClassName}
        >
          <option value="todos">Todos os responsáveis</option>
          {brokers.map((broker) => (
            <option key={broker.id} value={broker.id}>
              {broker.name}
            </option>
          ))}
        </select>

        <select
          value={filters.period}
          onChange={(event) => onChange({ ...filters, period: event.target.value as TaskFilters['period'] })}
          className={selectClassName}
        >
          {PERIOD_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>

        {filters.period === 'personalizado' && (
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={filters.periodStart}
              onChange={(event) => onChange({ ...filters, periodStart: event.target.value })}
              className={selectClassName}
            />
            <span className="text-sm text-neutral-400">até</span>
            <input
              type="date"
              value={filters.periodEnd}
              onChange={(event) => onChange({ ...filters, periodEnd: event.target.value })}
              className={selectClassName}
            />
          </div>
        )}

        <button
          type="button"
          onClick={() => onChange(defaultTaskFilters)}
          className="text-sm font-medium text-neutral-400 hover:text-neutral-900"
        >
          Limpar filtros
        </button>
      </div>
    </div>
  )
}
