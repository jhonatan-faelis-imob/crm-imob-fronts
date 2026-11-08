'use client'

import { MoreHorizontal, Pencil, StickyNote, Trash2 } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'
import type { ChecklistItem, ChecklistStatus } from '@/types'
import { CHECKLIST_STATUS_META } from '../constants'
import { StatusPicker } from './status-picker'

export function ChecklistRow({
  item,
  isSelecting,
  isSelected,
  onToggleSelected,
  onChange,
  onRename,
  onDelete,
}: {
  item: ChecklistItem
  isSelecting: boolean
  isSelected: boolean
  onToggleSelected: () => void
  onChange: (change: { status?: ChecklistStatus; notes?: string }) => void
  onRename: () => void
  onDelete: () => void
}) {
  const meta = CHECKLIST_STATUS_META[item.status]
  const Icon = meta.icon
  const isLoose = item.requirementId === null
  // Toque rápido só alterna pendente ↔ recebido; os outros status pedem o seletor
  const quickToggle: ChecklistStatus | null =
    item.status === 'pendente' ? 'recebido' : item.status === 'recebido' ? 'pendente' : null

  return (
    <li className="flex items-start gap-2 py-2.5">
      {isSelecting ? (
        <label className="flex h-11 w-11 shrink-0 items-center justify-center">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={onToggleSelected}
            aria-label={`Selecionar ${item.name}`}
            className="h-4 w-4 accent-brand"
          />
        </label>
      ) : quickToggle ? (
        <button
          type="button"
          onClick={() => onChange({ status: quickToggle })}
          aria-label={quickToggle === 'recebido' ? `Marcar ${item.name} como recebido` : `Voltar ${item.name} para pendente`}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full transition-colors hover:bg-neutral-100"
          style={{ color: meta.text }}
        >
          <Icon className="h-5 w-5" />
        </button>
      ) : (
        <StatusPicker
          item={item}
          onSave={onChange}
          trigger={
            <button
              type="button"
              aria-label={`Alterar status de ${item.name}`}
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full transition-colors hover:bg-neutral-100"
              style={{ color: meta.text }}
            >
              <Icon className="h-5 w-5" />
            </button>
          }
        />
      )}

      <div className="min-w-0 flex-1 pt-2.5">
        <div className="flex flex-wrap items-center gap-1.5">
          <p className={cn('break-words text-sm font-medium text-neutral-900', meta.strike && 'text-neutral-400 line-through')}>
            {item.name}
          </p>
          {!item.required && (
            <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-[11px] font-medium text-neutral-600">
              Opcional
            </span>
          )}
          {item.notes && (
            <span title={item.notes} aria-label="Tem observação" className="text-neutral-400">
              <StickyNote className="h-3.5 w-3.5" />
            </span>
          )}
        </div>
        {item.description && <p className="mt-0.5 text-xs text-neutral-400">{item.description}</p>}
        {item.notes && <p className="mt-1 break-words text-xs text-neutral-600">{item.notes}</p>}
      </div>

      <div className="flex shrink-0 items-center gap-0.5 pt-1.5">
        <StatusPicker
          item={item}
          onSave={onChange}
          trigger={
            <button
              type="button"
              className="min-h-9 rounded-full px-2.5 text-[11px] font-medium"
              style={{ backgroundColor: meta.bg, color: meta.text }}
            >
              <span className={meta.strike ? 'line-through' : undefined}>{meta.label}</span>
            </button>
          }
        />
        {isLoose && (
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <button
                  type="button"
                  aria-label={`Mais opções de ${item.name}`}
                  className="flex h-9 w-9 items-center justify-center rounded-full text-neutral-400 hover:bg-neutral-100 hover:text-neutral-900"
                />
              }
            >
              <MoreHorizontal className="h-4 w-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40 bg-white">
              <DropdownMenuItem className="min-h-11 sm:min-h-8" onClick={onRename}>
                <Pencil className="h-4 w-4" />
                Renomear
              </DropdownMenuItem>
              <DropdownMenuItem className="min-h-11 text-danger sm:min-h-8" onClick={onDelete}>
                <Trash2 className="h-4 w-4" />
                Excluir
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </li>
  )
}
