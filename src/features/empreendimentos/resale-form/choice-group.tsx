'use client'

// Escolha única em botões (Sim / Não / Não informado, exibição do endereço etc.)
export function ChoiceGroup<T extends string>({
  name,
  label,
  value,
  options,
  onChange,
}: {
  name: string
  label: string
  value: T
  options: { value: T; label: string }[]
  onChange: (value: T) => void
}) {
  return (
    <div role="radiogroup" aria-label={label} className="flex flex-wrap gap-1.5">
      {options.map((option) => {
        const selected = option.value === value
        return (
          <button
            key={`${name}-${option.value}`}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => onChange(option.value)}
            className={`min-h-11 rounded-[8px] border-[1.5px] px-3 text-sm font-medium transition-colors sm:min-h-10 ${
              selected
                ? 'border-brand bg-brand-bg text-brand'
                : 'border-neutral-200 text-neutral-600 hover:border-neutral-400'
            }`}
          >
            {option.label}
          </button>
        )
      })}
    </div>
  )
}
