import { Plus, Trash2, UserRound } from 'lucide-react'
import { useState } from 'react'
import { useFieldArray, useFormContext } from 'react-hook-form'
import { PreponentForm } from './preponent-form'
import { PREPONENT_RELATION_META } from './options'
import type { LeadFormValues, PreponentInputValues } from './schema'

export function TabPreponents() {
  const { control } = useFormContext<LeadFormValues>()
  const { fields, append, remove } = useFieldArray({ control, name: 'preponents' })
  const [isFormOpen, setIsFormOpen] = useState(false)

  function handleAdd(values: PreponentInputValues) {
    append({ id: crypto.randomUUID(), ...values })
    setIsFormOpen(false)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-neutral-400">
          {fields.length === 0
            ? 'Nenhum preponente adicionado'
            : `${fields.length} preponente${fields.length > 1 ? 's' : ''} adicionado${fields.length > 1 ? 's' : ''}`}
        </p>
        {!isFormOpen && (
          <button
            type="button"
            onClick={() => setIsFormOpen(true)}
            className="inline-flex items-center gap-2 rounded-[8px] bg-brand px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-brand-dark"
          >
            <Plus className="h-4 w-4" />
            Novo preponente
          </button>
        )}
      </div>

      {isFormOpen && <PreponentForm onAdd={handleAdd} onClose={() => setIsFormOpen(false)} />}

      {fields.length > 0 && (
        <ul className="space-y-2">
          {fields.map((field, index) => (
            <li
              key={field.id}
              className="flex items-center justify-between rounded-[16px] border-[0.5px] border-neutral-200 bg-white p-4"
            >
              <div className="flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-bg text-brand">
                  <UserRound className="h-4 w-4" />
                </span>
                <div>
                  <p className="text-sm font-medium text-neutral-900">{field.name}</p>
                  <p className="text-xs text-neutral-400">
                    {PREPONENT_RELATION_META[field.relation]} · {field.cpf}
                  </p>
                </div>
              </div>
              <button
                type="button"
                aria-label="Remover preponente"
                onClick={() => remove(index)}
                className="rounded-[8px] p-2 text-neutral-400 hover:bg-[#FFEBEE] hover:text-danger"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
