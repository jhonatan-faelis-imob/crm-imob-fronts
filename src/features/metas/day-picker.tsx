import type { MouseEvent } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { addDays } from '@/lib/date'
import { formatDayLabel } from './calculations'

const arrowClassName =
  'flex h-11 w-11 shrink-0 items-center justify-center rounded-[8px] border-[0.5px] border-neutral-200 text-neutral-600 transition-colors hover:bg-neutral-100 disabled:cursor-not-allowed disabled:opacity-40'

function openNativePicker(event: MouseEvent<HTMLInputElement>) {
  try {
    event.currentTarget.showPicker()
  } catch {
    // Navegador sem showPicker: o toque no próprio input já abre o seletor
  }
}

export function DayPicker({
  date,
  min,
  max,
  today,
  onChange,
}: {
  date: string
  min: string
  max: string
  today: string
  onChange: (date: string) => void
}) {
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <button
        type="button"
        aria-label="Dia anterior"
        disabled={date <= min}
        onClick={() => onChange(addDays(date, -1))}
        className={arrowClassName}
      >
        <ChevronLeft className="h-4 w-4" />
      </button>

      <div className="relative min-w-0 flex-1 basis-0">
        <span className="flex h-11 items-center justify-center rounded-[8px] border-[0.5px] border-neutral-200 px-2 text-center text-[13px] font-medium leading-tight text-neutral-900">
          {formatDayLabel(date)}
        </span>
        <input
          type="date"
          aria-label="Escolher data"
          value={date}
          min={min}
          max={max}
          onClick={openNativePicker}
          onChange={(event) => {
            const { value } = event.target
            if (value && value >= min && value <= max) onChange(value)
          }}
          className="absolute inset-0 h-full w-full cursor-pointer text-base opacity-0"
        />
      </div>

      <button
        type="button"
        aria-label="Próximo dia"
        disabled={date >= max}
        onClick={() => onChange(addDays(date, 1))}
        className={arrowClassName}
      >
        <ChevronRight className="h-4 w-4" />
      </button>

      {today >= min && today <= max && (
        <button
          type="button"
          disabled={date === today}
          onClick={() => onChange(today)}
          className="h-11 w-full shrink-0 rounded-[8px] border-[0.5px] border-neutral-200 px-3 text-sm font-medium text-neutral-600 transition-colors hover:bg-neutral-100 disabled:cursor-not-allowed disabled:opacity-40 sm:w-auto"
        >
          Hoje
        </button>
      )}
    </div>
  )
}
