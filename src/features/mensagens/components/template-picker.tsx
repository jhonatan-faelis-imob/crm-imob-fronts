'use client'

import { useState } from 'react'
import { ExternalLink, PenLine, Search } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { Skeleton } from '@/components/ui/skeleton'
import { messageTemplatesService } from '@/services/message-templates.service'
import type { MessageTemplate } from '@/types'
import { TEMPLATE_TYPES, templateTypeMeta } from '../constants'

const rowClassName =
  'flex min-h-11 w-full items-center gap-2 rounded-[8px] px-2 py-2 text-left transition-colors hover:bg-neutral-100'

export function normalizeSearch(text: string) {
  return text.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
}

export function TemplatePicker({
  onChoose,
  onOpenBlank,
}: {
  onChoose: (template: MessageTemplate | null) => void
  onOpenBlank?: () => void
}) {
  const [search, setSearch] = useState('')
  const { data: templates, isLoading, isError } = useQuery({
    queryKey: ['message-templates'],
    queryFn: messageTemplatesService.findAll,
  })

  const term = normalizeSearch(search.trim())
  const matches = (templates ?? []).filter((template) =>
    normalizeSearch(`${template.name} ${template.content}`).includes(term),
  )
  const groups = TEMPLATE_TYPES.map((type) => ({
    ...type,
    items: matches.filter((template) => templateTypeMeta(template.type).value === type.value),
  })).filter((group) => group.items.length > 0)

  return (
    <div className="flex min-h-0 flex-col gap-2">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Buscar modelo"
          aria-label="Buscar modelo"
          className="w-full rounded-[12px] border-[1.5px] border-neutral-200 bg-white py-2 pl-9 pr-3 text-base text-neutral-900 outline-none transition-colors placeholder:text-neutral-400 focus:border-brand sm:text-sm"
        />
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        <button type="button" onClick={() => onChoose(null)} className={rowClassName}>
          <PenLine className="h-4 w-4 shrink-0 text-neutral-600" />
          <span className="text-sm font-medium text-neutral-900">Mensagem livre</span>
        </button>
        {onOpenBlank && (
          <button type="button" onClick={onOpenBlank} className={rowClassName}>
            <ExternalLink className="h-4 w-4 shrink-0 text-neutral-600" />
            <span className="text-sm font-medium text-neutral-900">Abrir sem mensagem</span>
          </button>
        )}

        {isLoading && <Skeleton className="mt-2 h-24 rounded-[12px]" />}
        {isError && <p className="p-2 text-sm text-danger">Não foi possível carregar os modelos.</p>}
        {!isLoading && !isError && groups.length === 0 && (
          <p className="p-2 text-sm text-neutral-400">Nenhum modelo encontrado.</p>
        )}

        {groups.map((group) => (
          <div key={group.value} className="mt-2">
            <p className="px-2 pb-1 text-[11px] font-medium uppercase tracking-wide text-neutral-400">{group.label}</p>
            {group.items.map((template) => (
              <button
                key={template.id}
                type="button"
                onClick={() => onChoose(template)}
                className={`${rowClassName} flex-col !items-start !gap-0`}
              >
                <span className="text-sm font-medium text-neutral-900">{template.name}</span>
                <span className="w-full truncate text-xs text-neutral-400">{template.content.split('\n')[0]}</span>
              </button>
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}
