import { X } from 'lucide-react'
import { Controller, type Control, type FieldPath, type FieldValues } from 'react-hook-form'
import type { Member } from './types'

export function MemberMultiSelect<TFieldValues extends FieldValues>({
  control,
  name,
  options,
}: {
  control: Control<TFieldValues>
  name: FieldPath<TFieldValues>
  options: Member[]
}) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field }) => {
        const selectedIds = (field.value as string[] | undefined) ?? []
        const selectedMembers = options.filter((option) => selectedIds.includes(option.id))
        const availableOptions = options.filter((option) => !selectedIds.includes(option.id))

        function toggle(id: string) {
          field.onChange(
            selectedIds.includes(id) ? selectedIds.filter((item) => item !== id) : [...selectedIds, id]
          )
        }

        return (
          <div>
            {selectedMembers.length > 0 && (
              <div className="mb-2 flex flex-wrap gap-2">
                {selectedMembers.map((member) => (
                  <span
                    key={member.id}
                    className="flex items-center gap-1 rounded-full bg-brand-bg px-2.5 py-1 text-xs font-medium text-brand"
                  >
                    {member.name}
                    <button
                      type="button"
                      onClick={() => toggle(member.id)}
                      aria-label={`Remover ${member.name}`}
                      className="rounded-full hover:bg-brand/10"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}

            {availableOptions.length > 0 ? (
              <div className="flex flex-wrap gap-1.5 rounded-[12px] border-[1.5px] border-neutral-200 bg-white p-2">
                {availableOptions.map((member) => (
                  <button
                    key={member.id}
                    type="button"
                    onClick={() => toggle(member.id)}
                    className="rounded-full border-[0.5px] border-neutral-200 px-2.5 py-1 text-xs font-medium text-neutral-600 transition-colors hover:border-brand hover:text-brand"
                  >
                    + {member.name}
                  </button>
                ))}
              </div>
            ) : (
              <p className="text-xs text-neutral-400">Nenhum corretor disponível sem equipe.</p>
            )}
          </div>
        )
      }}
    />
  )
}
