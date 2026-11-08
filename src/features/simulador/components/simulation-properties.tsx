'use client'

import { Check, Link2, MapPin } from 'lucide-react'
import Link from 'next/link'
import { formatCurrency } from '@/lib/utils'
import type { SimulationProperty } from '@/services/simulations.service'
import { propertyLabel } from '@/features/empreendimentos/property-code'

const FIT_META = {
  cabe: { label: 'Cabe', bg: '#E8F5E9', text: '#008A05' },
  quase: { label: 'Quase', bg: '#FFF7E0', text: '#B45309' },
} as const

export function SimulationProperties({
  items,
  counts,
  canLink,
  linkedIds,
  linkingId,
  onLink,
}: {
  items: SimulationProperty[]
  counts: { cabe: number; quase: number }
  canLink: boolean
  linkedIds: Set<string>
  linkingId: string | null
  onLink: (property: SimulationProperty) => void
}) {
  const total = counts.cabe + counts.quase

  return (
    <section className="rounded-[16px] border-[0.5px] border-neutral-200 bg-white p-4 sm:p-5">
      <div className="flex items-baseline justify-between gap-2">
        <h3 className="text-sm font-semibold text-neutral-900">Imóveis que cabem</h3>
        {total > 0 && (
          <span className="text-xs text-neutral-400">
            {counts.cabe} cabem · {counts.quase} quase
            {total > items.length && ` · mostrando ${items.length}`}
          </span>
        )}
      </div>

      {items.length === 0 ? (
        <p className="mt-3 rounded-[12px] bg-neutral-100 p-3 text-sm text-neutral-400">
          Nenhum imóvel cadastrado cabe nessa faixa
        </p>
      ) : (
        <ul className="mt-2 divide-y-[0.5px] divide-neutral-200">
          {items.map((property) => {
            const fit = FIT_META[property.fit]
            const isLinked = linkedIds.has(property.id)
            const place = [property.neighborhood, property.city].filter(Boolean).join(', ')
            return (
              <li key={property.id} className="flex items-start gap-3 py-3">
                <Link href={`/empreendimentos?abrir=${property.id}`} className="group min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <p className="break-words text-sm font-medium text-neutral-900 group-hover:text-brand">
                      {propertyLabel(property.title, property.code)}
                    </p>
                    <span
                      className="rounded-full px-2 py-0.5 text-[11px] font-medium"
                      style={{ backgroundColor: fit.bg, color: fit.text }}
                    >
                      {fit.label}
                    </span>
                    {property.incomeMatch && (
                      <span className="rounded-full bg-brand-bg px-2 py-0.5 text-[11px] font-medium text-brand">
                        Renda ideal
                      </span>
                    )}
                  </div>
                  {place && (
                    <p className="mt-0.5 flex items-center gap-1 text-xs text-neutral-400">
                      <MapPin className="h-3 w-3" />
                      {place}
                    </p>
                  )}
                  <p className="mt-1 text-xs text-neutral-600">
                    {property.priceLabel === 'a partir de' ? 'a partir de ' : ''}
                    <span className="font-semibold text-neutral-900">{formatCurrency(property.referencePrice)}</span>
                    {' · '}
                    {property.downRemaining > 0
                      ? `Entrada a complementar: ${formatCurrency(property.downRemaining)}`
                      : 'Entrada coberta'}
                  </p>
                </Link>
                {canLink &&
                  (isLinked ? (
                    <span className="inline-flex h-9 shrink-0 items-center gap-1 rounded-[8px] px-2 text-xs font-medium text-success">
                      <Check className="h-3.5 w-3.5" />
                      Vinculado
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => onLink(property)}
                      disabled={linkingId === property.id}
                      className="inline-flex h-11 shrink-0 items-center gap-1 rounded-[8px] border-[0.5px] border-neutral-200 px-3 text-xs font-medium text-neutral-600 transition-colors hover:bg-neutral-100 disabled:opacity-60 sm:h-9"
                    >
                      <Link2 className="h-3.5 w-3.5" />
                      Vincular
                    </button>
                  ))}
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}
