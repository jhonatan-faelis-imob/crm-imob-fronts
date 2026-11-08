'use client'

import { CircleCheckBig, CircleDashed, CircleAlert, ChevronRight } from 'lucide-react'
import type { PortalReadiness, PortalReadinessKey } from '../portal/types'

// Checklist "Pronto para os portais", vindo de POST /properties/portal-readiness
export function ReadinessCard({
  readiness,
  onGoTo,
}: {
  readiness: PortalReadiness | undefined
  onGoTo: (key: PortalReadinessKey) => void
}) {
  if (!readiness) {
    return (
      <section className="rounded-[16px] border-[0.5px] border-neutral-200 bg-white p-4">
        <p className="text-sm font-semibold text-neutral-900">Pronto para os portais</p>
        <p className="mt-2 text-sm text-neutral-400">Verificando…</p>
      </section>
    )
  }

  const pending = readiness.items.filter((item) => item.ok === false).length

  return (
    <section className="rounded-[16px] border-[0.5px] border-neutral-200 bg-white p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-semibold text-neutral-900">Pronto para os portais</p>
        <span
          className="rounded-full px-2.5 py-0.5 text-xs font-medium"
          style={
            readiness.ready
              ? { backgroundColor: '#E8F5E9', color: '#008A05' }
              : { backgroundColor: '#FFF7E0', color: '#B45309' }
          }
        >
          {readiness.ready ? 'Tudo certo' : `Faltam ${pending} ${pending === 1 ? 'item' : 'itens'}`}
        </span>
      </div>

      <ul className="mt-3 space-y-1">
        {readiness.items.map((item) =>
          item.ok === false ? (
            <li key={item.key}>
              <button
                type="button"
                onClick={() => onGoTo(item.key)}
                className="flex min-h-11 w-full items-center gap-2 rounded-[8px] px-2 text-left hover:bg-neutral-100"
              >
                <CircleAlert className="h-4 w-4 shrink-0 text-warning" />
                <span className="min-w-0 flex-1">
                  <span className="block text-sm text-neutral-900">{item.label}</span>
                  {item.hint && <span className="block text-xs text-neutral-400">{item.hint}</span>}
                </span>
                <ChevronRight className="h-4 w-4 shrink-0 text-neutral-400" />
              </button>
            </li>
          ) : (
            <li key={item.key} className="flex min-h-9 items-center gap-2 px-2">
              {item.ok === true ? (
                <CircleCheckBig className="h-4 w-4 shrink-0 text-success" />
              ) : (
                <CircleDashed className="h-4 w-4 shrink-0 text-neutral-400" />
              )}
              <span className={`text-sm ${item.ok === true ? 'text-neutral-600' : 'text-neutral-400'}`}>{item.label}</span>
            </li>
          ),
        )}
      </ul>
    </section>
  )
}
