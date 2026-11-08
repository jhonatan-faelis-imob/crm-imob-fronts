'use client'

import { useQuery } from '@tanstack/react-query'
import { Loader2, Search, UserRound, X } from 'lucide-react'
import { useState } from 'react'
import { useFormContext, useWatch } from 'react-hook-form'
import { useDebouncedValue } from '@/lib/use-debounced-value'
import { leadsService } from '@/services/leads.service'
import { inputClassName } from '../property-form/field'
import type { ResaleFormValues } from './form'

interface SellerOption {
  id: string
  name: string
  phone: string | null
}

const MIN_TERM = 2

// Proprietário = um lead da organização (a API só devolve leads que o usuário pode ver)
export function SellerLeadPicker() {
  const { control, setValue } = useFormContext<ResaleFormValues>()
  const sellerLeadId = useWatch({ control, name: 'sellerLeadId' })
  const sellerLeadName = useWatch({ control, name: 'sellerLeadName' })
  const [term, setTerm] = useState('')
  const search = useDebouncedValue(term.trim(), 300)

  const { data, isFetching } = useQuery<{ data: SellerOption[] }>({
    queryKey: ['leads', 'seller-search', search],
    queryFn: () => leadsService.findAll({ search, limit: '8' }),
    enabled: search.length >= MIN_TERM,
    staleTime: 30_000,
    meta: { silent: true },
  })
  const results = search.length >= MIN_TERM ? (data?.data ?? []) : []

  function select(option: SellerOption) {
    setValue('sellerLeadId', option.id, { shouldDirty: true })
    setValue('sellerLeadName', option.name, { shouldDirty: true })
    setTerm('')
  }

  function clear() {
    setValue('sellerLeadId', '', { shouldDirty: true })
    setValue('sellerLeadName', '', { shouldDirty: true })
  }

  if (sellerLeadId) {
    return (
      <div className="flex min-h-11 items-center justify-between gap-2 rounded-[12px] border-[1.5px] border-neutral-200 px-3 py-2">
        <span className="flex min-w-0 items-center gap-2 text-[15px] text-neutral-900">
          <UserRound className="h-4 w-4 shrink-0 text-neutral-400" />
          <span className="truncate">{sellerLeadName || 'Lead vinculado'}</span>
        </span>
        <button
          type="button"
          onClick={clear}
          aria-label="Remover proprietário"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[8px] text-neutral-400 hover:bg-neutral-100 hover:text-neutral-900"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    )
  }

  return (
    <div className="relative">
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
      <input
        id="prop-seller"
        type="search"
        value={term}
        onChange={(event) => setTerm(event.target.value)}
        placeholder="Buscar lead pelo nome ou telefone"
        autoComplete="off"
        className={`${inputClassName} pl-9`}
      />
      {isFetching && (
        <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-neutral-400" />
      )}
      {search.length >= MIN_TERM && !isFetching && (
        <div className="absolute inset-x-0 top-full z-20 mt-1 max-h-60 overflow-y-auto rounded-[12px] border-[0.5px] border-neutral-200 bg-white p-1 shadow-lg">
          {results.length === 0 ? (
            <p className="px-3 py-2.5 text-sm text-neutral-400">Nenhum lead encontrado</p>
          ) : (
            results.map((option) => (
              <button
                key={option.id}
                type="button"
                onClick={() => select(option)}
                className="flex min-h-11 w-full flex-col items-start justify-center rounded-[8px] px-3 py-1.5 text-left hover:bg-neutral-100"
              >
                <span className="text-sm font-medium text-neutral-900">{option.name}</span>
                {option.phone && <span className="text-xs text-neutral-400">{option.phone}</span>}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  )
}
