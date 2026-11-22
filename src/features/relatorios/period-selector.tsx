import { Download } from 'lucide-react'
import type { PeriodFilter, PeriodPreset } from './types'

const PRESET_OPTIONS: { value: PeriodPreset; label: string }[] = [
  { value: 'mes', label: 'Este mês' },
  { value: 'trimestre', label: 'Este trimestre' },
  { value: 'ano', label: 'Este ano' },
  { value: 'personalizado', label: 'Personalizado' },
]

const dateInputClassName =
  'rounded-[8px] border-[1.5px] border-line bg-paper px-3 py-2 text-sm text-brand outline-none focus:border-brand'

export function PeriodSelector({
  filter,
  onChange,
  onExport,
}: {
  filter: PeriodFilter
  onChange: (filter: PeriodFilter) => void
  onExport: () => void
}) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-end">
      <div className="flex flex-wrap items-center gap-1 rounded-[8px] border-[0.5px] border-line bg-paper p-1">
        {PRESET_OPTIONS.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange({ ...filter, preset: option.value })}
            className={`rounded-[6px] px-3 py-1.5 text-sm font-medium transition-colors ${
              filter.preset === option.value ? 'bg-line text-brand' : 'text-muted-foreground hover:bg-canvas'
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>

      {filter.preset === 'personalizado' && (
        <div className="flex items-center gap-2">
          <input
            type="date"
            value={filter.startDate}
            onChange={(event) => onChange({ ...filter, startDate: event.target.value })}
            className={dateInputClassName}
          />
          <span className="text-sm text-muted-foreground">até</span>
          <input
            type="date"
            value={filter.endDate}
            onChange={(event) => onChange({ ...filter, endDate: event.target.value })}
            className={dateInputClassName}
          />
        </div>
      )}

      <button
        type="button"
        onClick={onExport}
        className="inline-flex items-center justify-center gap-2 rounded-[8px] border-[0.5px] border-line bg-transparent px-4 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-canvas"
      >
        <Download className="h-4 w-4" />
        Exportar
      </button>
    </div>
  )
}
