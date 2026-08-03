'use client'

import { useState } from 'react'
import type { Property } from '@/types'
import { LinkPropertyDialog } from './link-property-dialog'
import { LinkedPropertyCard } from './linked-property-card'

export function LinkedPropertiesTab({
  linkedProperties,
  suggestions,
  onLink,
  onUnlink,
}: {
  linkedProperties: Property[]
  suggestions: Property[]
  onLink: (property: Property) => void
  onUnlink: (propertyId: string) => void
}) {
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  function handleLink(property: Property) {
    if (linkedProperties.some((item) => item.id === property.id)) return
    onLink(property)
  }

  return (
    <div className="space-y-6">
      <div>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 className="text-sm font-semibold text-neutral-900">Imóveis vinculados</h3>
          <button
            type="button"
            onClick={() => setIsDialogOpen(true)}
            className="rounded-[8px] bg-brand px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-dark"
          >
            Vincular imóvel/empreendimento
          </button>
        </div>

        <div className="mt-3 space-y-3">
          {linkedProperties.map((property) => (
            <LinkedPropertyCard
              key={property.id}
              property={property}
              action={
                <button
                  type="button"
                  onClick={() => onUnlink(property.id)}
                  className="shrink-0 rounded-[8px] border-[1.5px] border-neutral-200 px-3 py-1.5 text-xs font-medium text-neutral-600 transition-colors hover:border-danger hover:text-danger"
                >
                  Desvincular
                </button>
              }
            />
          ))}

          {linkedProperties.length === 0 && (
            <p className="rounded-[16px] border-[0.5px] border-dashed border-neutral-200 p-6 text-center text-sm text-neutral-400">
              Nenhum imóvel vinculado ainda.
            </p>
          )}
        </div>
      </div>

      {suggestions.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-neutral-900">Sugestões por renda</h3>
          <p className="mt-0.5 text-xs text-neutral-400">
            Empreendimentos com faixa de renda compatível com o perfil financeiro do lead.
          </p>
          <div className="mt-3 space-y-3">
            {suggestions.map((property) => (
              <LinkedPropertyCard
                key={property.id}
                property={property}
                compatible
                action={
                  <button
                    type="button"
                    onClick={() => handleLink(property)}
                    className="shrink-0 rounded-[8px] border-[1.5px] border-neutral-200 px-3 py-1.5 text-xs font-medium text-neutral-600 transition-colors hover:border-brand hover:text-brand"
                  >
                    Vincular
                  </button>
                }
              />
            ))}
          </div>
        </div>
      )}

      <LinkPropertyDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        excludeIds={linkedProperties.map((property) => property.id)}
        onLink={(property) => {
          handleLink(property)
          setIsDialogOpen(false)
        }}
      />
    </div>
  )
}
