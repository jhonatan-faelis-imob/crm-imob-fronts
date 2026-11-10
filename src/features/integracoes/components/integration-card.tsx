'use client'

import type { IntegrationCatalogItem } from '@/services/integrations.service'
import { PROVIDER_ICON, timeAgo } from '../constants'
import { StatusBadge } from './panel-shell'

export function IntegrationCard({ item, onOpen }: { item: IntegrationCatalogItem; onOpen: () => void }) {
  const Icon = PROVIDER_ICON[item.provider]
  const comingSoon = item.status === 'em_breve'
  return (
    <div className="flex h-full flex-col rounded-[16px] border-[0.5px] border-neutral-200 bg-white p-4 sm:p-5">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px] bg-brand-bg text-brand">
          <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-base font-semibold text-neutral-900">{item.name}</h3>
            <StatusBadge status={item.status} />
          </div>
          <p className="mt-1 text-sm text-neutral-400">{item.description}</p>
        </div>
      </div>
      <div className="mt-4 flex flex-1 items-end justify-between gap-2">
        <p className="text-xs text-neutral-400">{item.lastEventAt ? `Última atividade ${timeAgo(item.lastEventAt)}` : ''}</p>
        <button
          type="button"
          onClick={onOpen}
          className="inline-flex h-10 shrink-0 items-center rounded-[8px] border-[1.5px] border-neutral-200 px-4 text-sm font-medium text-neutral-900 transition-colors hover:bg-neutral-100"
        >
          {comingSoon ? 'Ver requisitos' : 'Configurar'}
        </button>
      </div>
    </div>
  )
}
