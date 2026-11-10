'use client'

import { Circle } from 'lucide-react'
import type { IntegrationCatalogItem } from '@/services/integrations.service'
import { Notice, PanelShell } from './panel-shell'

// Só informativo: sem nenhuma ação nesta etapa
export function ComingSoonPanel({
  item,
  onOpenChange,
}: {
  item: IntegrationCatalogItem | null
  onOpenChange: (open: boolean) => void
}) {
  return (
    <PanelShell
      open={item !== null}
      onOpenChange={onOpenChange}
      title={item?.name ?? ''}
      description={item?.description ?? ''}
      status="em_breve"
    >
      {item && (
        <>
          <section className="space-y-3">
            <h3 className="text-sm font-semibold text-neutral-900">O que vai ser preciso</h3>
            <ul className="space-y-2">
              {item.requirements.map((requirement) => (
                <li key={requirement} className="flex items-start gap-2 text-sm text-neutral-600">
                  <Circle className="mt-0.5 h-4 w-4 shrink-0 text-neutral-400" />
                  {requirement}
                </li>
              ))}
            </ul>
          </section>
          <Notice tone="info">Esta integração ainda está em desenvolvimento. Você pode ir preparando os itens acima.</Notice>
        </>
      )}
    </PanelShell>
  )
}
