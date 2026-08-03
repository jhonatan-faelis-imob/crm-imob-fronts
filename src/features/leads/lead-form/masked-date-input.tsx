import { Controller, type Control, type FieldPath, type FieldValues } from 'react-hook-form'
import { inputClassName } from './field'

function formatDateInput(raw: string) {
  const digits = raw.replace(/\D/g, '').slice(0, 8)
  const day = digits.slice(0, 2)
  const month = digits.slice(2, 4)
  const year = digits.slice(4, 8)
  return [day, month, year].filter(Boolean).join('/')
}

export function MaskedDateInput<TFieldValues extends FieldValues>({
  control,
  name,
  id,
}: {
  control: Control<TFieldValues>
  name: FieldPath<TFieldValues>
  id?: string
}) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field }) => (
        <input
          id={id}
          inputMode="numeric"
          placeholder="DD/MM/AAAA"
          className={inputClassName}
          value={typeof field.value === 'string' ? field.value : ''}
          onChange={(event) => field.onChange(formatDateInput(event.target.value))}
          onBlur={field.onBlur}
          name={field.name}
          ref={field.ref}
        />
      )}
    />
  )
}
