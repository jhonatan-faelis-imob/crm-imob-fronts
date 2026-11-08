'use client'

import { Check, Search } from 'lucide-react'
import { useState } from 'react'
import type { PortalConfig } from '../portal/types'

function normalize(value: string) {
  return value
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
}

// Chips com busca; as marcadas ficam no topo
export function FeaturesPicker({
  config,
  value,
  onChange,
}: {
  config: PortalConfig
  value: string[]
  onChange: (value: string[]) => void
}) {
  const [query, setQuery] = useState('')
  const max = config.limits.FEATURES_MAX
  const selected = new Set(value)
  const term = normalize(query.trim())

  const options = config.features
    .filter((feature) => term === '' || normalize(feature.label).includes(term))
    .sort((a, b) => Number(selected.has(b.value)) - Number(selected.has(a.value)))

  function toggle(featureValue: string) {
    if (selected.has(featureValue)) {
      onChange(value.filter((item) => item !== featureValue))
    } else if (value.length < max) {
      onChange([...value, featureValue])
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="relative min-w-0 flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Buscar característica"
            aria-label="Buscar característica"
            className="w-full rounded-[12px] border-[1.5px] border-neutral-200 bg-white py-2.5 pl-9 pr-3 text-[16px] text-neutral-900 outline-none placeholder:text-neutral-400 focus:border-brand sm:text-[15px]"
          />
        </div>
        <span className="text-xs text-neutral-400">
          {value.length}/{max} marcadas
        </span>
      </div>

      <div className="flex max-h-64 flex-wrap gap-1.5 overflow-y-auto rounded-[12px] bg-neutral-100 p-2">
        {options.length === 0 ? (
          <p className="px-1 py-1.5 text-sm text-neutral-400">Nenhuma característica encontrada</p>
        ) : (
          options.map((feature) => {
            const isSelected = selected.has(feature.value)
            const disabled = !isSelected && value.length >= max
            return (
              <button
                key={feature.value}
                type="button"
                aria-pressed={isSelected}
                disabled={disabled}
                onClick={() => toggle(feature.value)}
                className={`inline-flex min-h-9 items-center gap-1 rounded-full border-[1px] px-3 text-[13px] font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
                  isSelected
                    ? 'border-brand bg-brand-bg text-brand'
                    : 'border-neutral-200 bg-white text-neutral-600 hover:border-neutral-400'
                }`}
              >
                {isSelected && <Check className="h-3.5 w-3.5" />}
                {feature.label}
              </button>
            )
          })
        )}
      </div>
    </div>
  )
}
