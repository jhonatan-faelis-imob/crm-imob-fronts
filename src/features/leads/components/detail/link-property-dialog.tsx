'use client'

import { Search } from 'lucide-react'
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Skeleton } from '@/components/ui/skeleton'
import { mapApiPropertyToProperty, type ApiProperty } from '@/features/empreendimentos/api'
import { propertiesService } from '@/services/properties.service'
import type { Property } from '@/types'
import { LinkedPropertyCard } from './linked-property-card'

export function LinkPropertyDialog({
  open,
  onOpenChange,
  excludeIds,
  onLink,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  excludeIds: string[]
  onLink: (property: Property) => void
}) {
  const [query, setQuery] = useState('')

  const { data, isLoading } = useQuery<{ data: ApiProperty[] }>({
    queryKey: ['properties', 'search', query],
    queryFn: () => propertiesService.findAll({ search: query, limit: '20' }),
    enabled: open,
  })

  const excluded = new Set(excludeIds)
  const results = (data?.data ?? []).map(mapApiPropertyToProperty).filter((property) => !excluded.has(property.id))

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen: boolean) => {
        onOpenChange(nextOpen)
        if (!nextOpen) setQuery('')
      }}
    >
      <DialogContent className="flex max-h-[80vh] w-[calc(100%-2rem)] max-w-lg flex-col gap-0 rounded-2xl border-[0.5px] border-neutral-200 bg-white p-0 ring-0">
        <DialogHeader className="shrink-0 gap-1 border-b-[0.5px] border-neutral-200 p-4 pr-12 sm:p-6 sm:pr-14">
          <DialogTitle>Vincular imóvel ou empreendimento</DialogTitle>
          <DialogDescription>Busque pelo nome ou cidade.</DialogDescription>
        </DialogHeader>

        <div className="shrink-0 border-b-[0.5px] border-neutral-200 p-4 sm:p-6">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
            <input
              autoFocus
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Buscar por nome ou cidade..."
              className="w-full rounded-[12px] border-[1.5px] border-neutral-200 bg-white py-2.5 pl-9 pr-3 text-[15px] text-neutral-900 outline-none placeholder:text-neutral-400 focus:border-brand"
            />
          </div>
        </div>

        <div className="flex-1 space-y-3 overflow-y-auto p-4 sm:p-6">
          {isLoading ? (
            Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-20 w-full rounded-[16px]" />)
          ) : (
            <>
              {results.map((property) => (
                <LinkedPropertyCard
                  key={property.id}
                  property={property}
                  action={
                    <button
                      type="button"
                      onClick={() => onLink(property)}
                      className="shrink-0 rounded-[8px] bg-brand px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-brand-dark"
                    >
                      Vincular
                    </button>
                  }
                />
              ))}
              {results.length === 0 && (
                <p className="rounded-[16px] border-[0.5px] border-dashed border-neutral-200 p-6 text-center text-sm text-neutral-400">
                  Nenhum imóvel encontrado.
                </p>
              )}
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
