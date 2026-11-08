import { Building2, Home, type LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'

// Área da foto do "Ver imóvel" e da página pública. Sem fotos: painel em gradiente com o ícone do tipo.
// Com fotos (próxima etapa): carrossel por deslizar, só com CSS (scroll-snap), funciona também no servidor.
export function PhotoArea({
  photos,
  kind,
  title,
  badge,
  className = '',
}: {
  photos: string[]
  kind: 'revenda' | 'empreendimento'
  title: string
  badge?: ReactNode
  className?: string
}) {
  const Icon: LucideIcon = kind === 'empreendimento' ? Building2 : Home

  return (
    <div className={`relative overflow-hidden ${className}`}>
      {photos.length > 0 ? (
        <div className="flex h-full snap-x snap-mandatory overflow-x-auto [scrollbar-width:none]" aria-label="Fotos do imóvel">
          {photos.map((src, index) => (
            // eslint-disable-next-line @next/next/no-img-element -- fotos virão de storage externo
            <img
              key={src}
              src={src}
              alt={`${title}: foto ${index + 1} de ${photos.length}`}
              className="h-full w-full shrink-0 snap-center object-cover"
              loading={index === 0 ? 'eager' : 'lazy'}
            />
          ))}
        </div>
      ) : (
        <div
          className="flex h-full w-full items-center justify-center"
          style={{ background: 'linear-gradient(135deg, #FFF0F2 0%, #F7F5F3 100%)' }}
        >
          <Icon className="h-16 w-16 text-brand/70 sm:h-20 sm:w-20" strokeWidth={1.25} aria-hidden="true" />
        </div>
      )}
      {photos.length > 1 && (
        <span className="absolute bottom-3 right-3 rounded-full bg-black/60 px-2.5 py-1 text-xs font-medium text-white">
          {photos.length} fotos
        </span>
      )}
      {badge && <div className="absolute left-3 top-3">{badge}</div>}
    </div>
  )
}

export const SITUATION_META = {
  disponivel: { label: 'Disponível', bg: '#E8F5E9', text: '#008A05' },
  reservado: { label: 'Reservado', bg: '#FFF3E0', text: '#C45800' },
  vendido: { label: 'Vendido', bg: '#FFEBEE', text: '#D93B30' },
} as const

export type Situation = keyof typeof SITUATION_META

export function SituationBadge({ situation, large = false }: { situation: Situation; large?: boolean }) {
  const meta = SITUATION_META[situation]
  return (
    <span
      className={`inline-flex items-center rounded-full font-semibold shadow-sm ${large ? 'px-3.5 py-1.5 text-sm' : 'px-2.5 py-1 text-xs'}`}
      style={{ backgroundColor: meta.bg, color: meta.text }}
    >
      {meta.label}
    </span>
  )
}
