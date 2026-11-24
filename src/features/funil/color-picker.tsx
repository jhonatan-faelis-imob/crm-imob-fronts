'use client'

import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import { STAGE_PALETTE, isHexColor } from './constants'

/** Paleta pronta (as cores dos selos de etapa) e campo para digitar o código #RRGGBB */
export function ColorPicker({
  value,
  onChange,
  idPrefix,
}: {
  value: string
  onChange: (color: string) => void
  idPrefix: string
}) {
  const typedInvalid = !isHexColor(value)

  return (
    <div className="space-y-3">
      <div role="radiogroup" aria-label="Cor da etapa" className="flex flex-wrap gap-2">
        {STAGE_PALETTE.map((color) => {
          const selected = value.toLowerCase() === color.toLowerCase()
          return (
            <button
              key={color}
              type="button"
              role="radio"
              aria-checked={selected}
              aria-label={`Cor ${color}`}
              onClick={() => onChange(color)}
              className={cn(
                'flex size-11 items-center justify-center rounded-full border-2 transition-transform sm:size-9',
                selected ? 'scale-110 border-brand' : 'border-transparent hover:scale-105',
              )}
              style={{ backgroundColor: color }}
            >
              {selected && <Check className="h-4 w-4 text-paper" />}
            </button>
          )
        })}
      </div>
      <div className="flex items-center gap-3">
        <span
          className="size-9 shrink-0 rounded-full border-[0.5px] border-line"
          style={{ backgroundColor: typedInvalid ? 'transparent' : value }}
        />
        <div className="flex-1">
          <label htmlFor={`${idPrefix}-hex`} className="sr-only">
            Código da cor
          </label>
          <input
            id={`${idPrefix}-hex`}
            value={value}
            onChange={(event) => onChange(event.target.value.trim())}
            maxLength={7}
            placeholder="#6366f1"
            autoComplete="off"
            aria-invalid={typedInvalid}
            className="w-full rounded-[12px] border-[1.5px] border-line bg-paper px-3 py-2.5 font-mono text-base text-brand outline-none focus:border-brand aria-[invalid=true]:border-danger"
          />
        </div>
      </div>
      {typedInvalid && <p className="text-[12px] text-danger">Use o formato #RRGGBB, por exemplo #6366f1.</p>}
    </div>
  )
}
