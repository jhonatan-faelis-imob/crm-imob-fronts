import { IMaskInput } from 'react-imask'
import type { FactoryOpts } from 'imask'
import { Controller, type Control, type FieldPath, type FieldValues } from 'react-hook-form'
import { inputClassName } from './field'

export function MaskedInput<TFieldValues extends FieldValues>({
  control,
  name,
  mask,
  id,
  placeholder,
  className,
}: {
  control: Control<TFieldValues>
  name: FieldPath<TFieldValues>
  mask: FactoryOpts
  id?: string
  placeholder?: string
  className?: string
}) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field }) => (
        <IMaskInput
          {...mask}
          id={id}
          placeholder={placeholder}
          className={className ?? inputClassName}
          value={typeof field.value === 'string' ? field.value : ''}
          unmask={false}
          onAccept={(value) => field.onChange(value)}
          onBlur={field.onBlur}
          inputRef={field.ref}
        />
      )}
    />
  )
}
