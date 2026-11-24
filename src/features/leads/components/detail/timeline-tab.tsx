'use client'

import {
  ArrowRightLeft,
  Home,
  Mail,
  MessageCircle,
  MoreHorizontal,
  Pencil,
  Phone,
  Trash2,
  Users,
  type LucideIcon,
} from 'lucide-react'
import { useState } from 'react'
import type { TaskType } from '@/types'
import { STATUS_META } from '../../constants'
import { formatDateTimeBR, formatRelativeTime } from './format'
import type { TimelineEntry } from './types'

const INTERACTION_TYPES: TaskType[] = ['ligacao', 'whatsapp', 'email', 'visita']

const TYPE_META: Record<TaskType, { label: string; icon: LucideIcon; bg: string; text: string }> = {
  ligacao: { label: 'Ligação', icon: Phone, bg: '#EBF5FF', text: '#0070F3' },
  whatsapp: { label: 'WhatsApp', icon: MessageCircle, bg: '#E8F5E9', text: '#008A05' },
  email: { label: 'Email', icon: Mail, bg: '#F3E8FF', text: '#7C3AED' },
  visita: { label: 'Visita', icon: Home, bg: '#FFF3E0', text: '#C45800' },
  reuniao: { label: 'Reunião', icon: Users, bg: '#FFF0F2', text: '#FF385C' },
  outro: { label: 'Outro', icon: MoreHorizontal, bg: '#F7F7F7', text: '#767676' },
}

export function TimelineTab({
  entries,
  isSaving,
  onCreate,
  onDelete,
}: {
  entries: TimelineEntry[]
  isSaving?: boolean
  onCreate: (data: { type: TaskType; notes: string }) => void
  onDelete: (id: string) => void
}) {
  const [selectedType, setSelectedType] = useState<TaskType>('ligacao')
  const [notes, setNotes] = useState('')

  function handleSave() {
    const text = notes.trim()
    if (!text) return
    onCreate({ type: selectedType, notes: text })
    setNotes('')
  }

  return (
    <div className="space-y-4">
      <div className="rounded-[16px] border-[0.5px] border-line bg-paper p-4">
        <textarea
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
          placeholder="Registrar interação..."
          rows={2}
          className="w-full resize-none rounded-[12px] border-[1.5px] border-line bg-paper px-3 py-2.5 text-[15px] text-brand outline-none transition-colors placeholder:text-muted-foreground focus:border-brand"
        />
        <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-1.5">
            {INTERACTION_TYPES.map((type) => {
              const meta = TYPE_META[type]
              const Icon = meta.icon
              const isSelected = selectedType === type
              return (
                <button
                  key={type}
                  type="button"
                  onClick={() => setSelectedType(type)}
                  className={`flex items-center gap-1.5 rounded-full border-[1.5px] px-3 py-1.5 text-xs font-medium transition-colors ${
                    isSelected
                      ? 'border-brand bg-line text-brand'
                      : 'border-line text-muted-foreground hover:border-line-strong'
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {meta.label}
                </button>
              )
            })}
          </div>
          <button
            type="button"
            onClick={handleSave}
            disabled={notes.trim() === '' || isSaving}
            className="rounded-[8px] bg-brand px-4 py-2 text-sm font-medium text-paper transition-colors hover:bg-ink disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSaving ? 'Salvando...' : 'Salvar'}
          </button>
        </div>
      </div>

      <div className="space-y-3">
        {entries.map((entry) => {
          if (entry.kind === 'stage_change') {
            return (
              <div key={entry.id} className="flex items-start gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-canvas text-muted-foreground">
                  <ArrowRightLeft className="h-4 w-4" />
                </span>
                <div className="min-w-0 flex-1 pt-1.5">
                  <p className="text-sm text-muted-foreground">
                    Movido de{' '}
                    <span className="font-medium text-brand">{STATUS_META[entry.fromStatus].label}</span> →{' '}
                    <span className="font-medium text-brand">{STATUS_META[entry.toStatus].label}</span>
                  </p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {entry.userName} · {formatRelativeTime(entry.occurredAt)}
                  </p>
                </div>
              </div>
            )
          }

          const meta = TYPE_META[entry.type]
          const Icon = meta.icon

          return (
            <div
              key={entry.id}
              className="group flex items-start gap-3 rounded-[16px] border-[0.5px] border-line bg-paper p-4 transition-colors hover:border-brand"
            >
              <span
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full"
                style={{ backgroundColor: meta.bg, color: meta.text }}
              >
                <Icon className="h-4 w-4" />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-medium text-brand">
                    {entry.userName}{' '}
                    <span className="font-normal text-muted-foreground" title={formatDateTimeBR(entry.occurredAt)}>
                      · {formatRelativeTime(entry.occurredAt)}
                    </span>
                  </p>
                  <div className="hidden shrink-0 items-center gap-1 group-hover:flex">
                    <button
                      type="button"
                      aria-label="Editar interação"
                      className="rounded-[6px] p-1 text-muted-foreground hover:bg-canvas hover:text-brand"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      aria-label="Excluir interação"
                      onClick={() => onDelete(entry.id)}
                      className="rounded-[6px] p-1 text-muted-foreground hover:bg-[#FFEBEE] hover:text-danger"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
                <p className="mt-1 break-words text-sm text-muted-foreground">{entry.notes}</p>
              </div>
            </div>
          )
        })}

        {entries.length === 0 && (
          <p className="rounded-[16px] border-[0.5px] border-dashed border-line p-6 text-center text-sm text-muted-foreground">
            Nenhuma interação registrada ainda.
          </p>
        )}
      </div>
    </div>
  )
}
