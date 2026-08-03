import { X } from 'lucide-react'
import { useState } from 'react'
import { Controller, type Control, type FieldPath, type FieldValues } from 'react-hook-form'

export function TagsInput<TFieldValues extends FieldValues>({
  control,
  name,
  id,
  suggestions = [],
  placeholder = 'Digite e pressione Enter',
}: {
  control: Control<TFieldValues>
  name: FieldPath<TFieldValues>
  id?: string
  suggestions?: string[]
  placeholder?: string
}) {
  const [text, setText] = useState('')

  return (
    <Controller
      control={control}
      name={name}
      render={({ field }) => {
        const tags = (field.value as string[] | undefined) ?? []

        function addTag(rawValue: string) {
          const value = rawValue.trim()
          if (!value || tags.includes(value)) return
          field.onChange([...tags, value])
          setText('')
        }

        function removeTag(value: string) {
          field.onChange(tags.filter((tag) => tag !== value))
        }

        const availableSuggestions = suggestions.filter((suggestion) => !tags.includes(suggestion))

        return (
          <div>
            <div className="flex flex-wrap items-center gap-2 rounded-[12px] border-[1.5px] border-neutral-200 bg-white p-2 focus-within:border-brand">
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="flex items-center gap-1 rounded-full bg-brand-bg px-2.5 py-1 text-xs font-medium text-brand"
                >
                  {tag}
                  <button
                    type="button"
                    onClick={() => removeTag(tag)}
                    aria-label={`Remover ${tag}`}
                    className="rounded-full hover:bg-brand/10"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
              <input
                id={id}
                value={text}
                onChange={(event) => setText(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    event.preventDefault()
                    addTag(text)
                  }
                }}
                onBlur={field.onBlur}
                placeholder={tags.length === 0 ? placeholder : ''}
                className="min-w-[120px] flex-1 border-none bg-transparent text-[15px] text-neutral-900 outline-none placeholder:text-neutral-400"
              />
            </div>

            {availableSuggestions.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {availableSuggestions.map((suggestion) => (
                  <button
                    key={suggestion}
                    type="button"
                    onClick={() => addTag(suggestion)}
                    className="rounded-full border-[0.5px] border-neutral-200 px-2.5 py-1 text-xs font-medium text-neutral-600 transition-colors hover:border-brand hover:text-brand"
                  >
                    + {suggestion}
                  </button>
                ))}
              </div>
            )}
          </div>
        )
      }}
    />
  )
}
