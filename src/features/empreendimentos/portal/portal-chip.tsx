'use client'

import { CircleCheckBig, CircleAlert } from 'lucide-react'
import type { Property } from '@/types'

// Usa o resumo `portal` que já vem na listagem; clicar abre o cadastro na aba "Descrição e portais"
export function PortalChip({ property, onOpen }: { property: Property; onOpen: () => void }) {
  if (!property.portal) return null
  const { ready, missingCount } = property.portal

  return (
    <button
      type="button"
      onClick={onOpen}
      aria-label={ready ? 'Pronto para os portais: abrir' : `Faltam ${missingCount} itens para os portais: abrir`}
      className="inline-flex min-h-7 items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-medium transition-opacity hover:opacity-80"
      style={ready ? { backgroundColor: '#E8F5E9', color: '#008A05' } : { backgroundColor: '#FFF7E0', color: '#B45309' }}
    >
      {ready ? <CircleCheckBig className="h-3 w-3" /> : <CircleAlert className="h-3 w-3" />}
      {ready ? 'Pronto p/ portais' : `Faltam ${missingCount} ${missingCount === 1 ? 'item' : 'itens'}`}
      {property.publishToPortals && <span className="font-semibold">· Publicado</span>}
    </button>
  )
}
