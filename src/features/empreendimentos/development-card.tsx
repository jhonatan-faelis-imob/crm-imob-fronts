import { Building2, Eye, MoreVertical } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { formatCurrency } from '@/lib/utils'
import type { Property } from '@/types'
import { DEVELOPMENT_STATUS_META, type DevelopmentStatus } from './constants'
import { CodeChip } from './property-form/property-code-field'

function formatDate(dateIso: string) {
  return new Date(dateIso).toLocaleDateString('pt-BR')
}

export function DevelopmentCard({
  development,
  onView,
  onEdit,
  onDeactivate,
}: {
  development: Property
  onView: () => void
  onEdit: () => void
  onDeactivate: () => void
}) {
  const status = DEVELOPMENT_STATUS_META[development.status as DevelopmentStatus]
  const totalUnits = development.totalUnits ?? 0
  const soldUnits = development.soldUnits ?? 0
  const progress = totalUnits > 0 ? Math.min(100, Math.round((soldUnits / totalUnits) * 100)) : 0

  return (
    // Botão invisível cobre o card (abre o "Ver imóvel"); os controles ficam por cima (z-[2])
    <div className="group relative flex flex-col gap-4 rounded-[16px] border-[0.5px] border-neutral-200 bg-white p-4 transition-colors hover:border-brand sm:flex-row">
      <button
        type="button"
        onClick={onView}
        aria-label={`Ver imóvel: ${development.title}`}
        className="absolute inset-0 z-[1] rounded-[16px] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
      />
      <div className="flex h-40 shrink-0 items-center justify-center rounded-[12px] bg-brand-bg sm:h-auto sm:w-48">
        <Building2 className="h-10 w-10 text-brand" strokeWidth={1.5} />
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="flex min-w-0 items-center gap-2">
              <p className="truncate text-[16px] font-semibold text-neutral-900">{development.title}</p>
              <CodeChip code={development.code} className="shrink-0" />
            </div>
            <p className="mt-0.5 text-[13px] text-neutral-400">
              {development.city}
              {development.neighborhood ? ` · ${development.neighborhood}` : ''}
            </p>
          </div>

          <div className="relative z-[2] flex shrink-0 items-center gap-1">
            <button
              type="button"
              onClick={onView}
              aria-label="Ver imóvel"
              className="flex h-9 w-9 items-center justify-center rounded-[8px] text-neutral-400 hover:bg-neutral-100 hover:text-neutral-900"
            >
              <Eye className="h-4 w-4" />
            </button>
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <button
                    type="button"
                    aria-label="Mais opções"
                    className="flex h-9 w-9 items-center justify-center rounded-[8px] text-neutral-400 hover:bg-neutral-100 hover:text-neutral-900"
                  />
                }
              >
                <MoreVertical className="h-4 w-4" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={onView}>Ver imóvel</DropdownMenuItem>
                <DropdownMenuItem onClick={onEdit}>Editar</DropdownMenuItem>
                <DropdownMenuItem variant="destructive" onClick={onDeactivate}>
                  Desativar
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          <span className="rounded-full bg-neutral-100 px-2.5 py-1 text-xs font-medium text-neutral-600">
            {totalUnits} unidades
          </span>
          {development.startingPrice !== undefined && (
            <span className="rounded-full bg-neutral-100 px-2.5 py-1 text-xs font-medium text-neutral-600">
              A partir de {formatCurrency(development.startingPrice)}
            </span>
          )}
          {development.minIncome !== undefined && development.maxIncome !== undefined && (
            <span className="rounded-full bg-neutral-100 px-2.5 py-1 text-xs font-medium text-neutral-600">
              Renda {formatCurrency(development.minIncome)} – {formatCurrency(development.maxIncome)}
            </span>
          )}
        </div>

        <div className="mt-3">
          <div className="h-2 w-full overflow-hidden rounded-full bg-neutral-100">
            <div className="h-full rounded-full bg-brand" style={{ width: `${progress}%` }} />
          </div>
          <p className="mt-1.5 text-xs text-neutral-400">
            {soldUnits} de {totalUnits} unidades vendidas
          </p>
        </div>

        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t-[0.5px] border-neutral-200 pt-3">
          <p className="text-xs text-neutral-400">
            {development.ownerName} · Cadastrado em {formatDate(development.createdAt)}
          </p>
          <span
            className="rounded-full px-2.5 py-1 text-xs font-medium"
            style={{ backgroundColor: status.bg, color: status.text }}
          >
            {status.label}
          </span>
        </div>
      </div>
    </div>
  )
}
