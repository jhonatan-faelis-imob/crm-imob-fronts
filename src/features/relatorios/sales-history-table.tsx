'use client'

import { Search } from 'lucide-react'
import Link from 'next/link'
import { useMemo, useState } from 'react'
import { Skeleton } from '@/components/ui/skeleton'
import { formatCurrency } from '@/lib/utils'
import type { Sale } from '@/types'
import { SALE_STATUS_META } from './constants'

const PAGE_SIZE = 5

function formatDate(dateIso: string) {
  return new Date(dateIso).toLocaleDateString('pt-BR')
}

function matchesSearch(sale: Sale, search: string) {
  if (!search) return true
  const query = search.toLowerCase()
  return (
    (sale.leadName ?? '').toLowerCase().includes(query) ||
    sale.propertyTitle.toLowerCase().includes(query) ||
    sale.brokerName.toLowerCase().includes(query)
  )
}

export function SalesHistoryTable({ data, isLoading }: { data: Sale[]; isLoading: boolean }) {
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)

  const filtered = useMemo(() => data.filter((sale) => matchesSearch(sale, search)), [data, search])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const currentPage = Math.min(page, totalPages)
  const pageItems = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)

  function handleSearchChange(value: string) {
    setSearch(value)
    setPage(1)
  }

  return (
    <div className="rounded-[16px] border-[0.5px] border-neutral-200 bg-white p-5 lg:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-[20px] font-semibold text-neutral-900">Histórico de vendas</h2>
        <div className="relative w-full sm:w-64">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
          <input
            type="text"
            value={search}
            onChange={(event) => handleSearchChange(event.target.value)}
            placeholder="Buscar por cliente, imóvel ou corretor"
            className="w-full rounded-[8px] border-[1.5px] border-neutral-200 bg-white py-2 pl-9 pr-3 text-sm text-neutral-900 outline-none placeholder:text-neutral-400 focus:border-brand"
          />
        </div>
      </div>

      {isLoading ? (
        <Skeleton className="mt-4 h-64 w-full rounded-[12px]" />
      ) : (
        <>
      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[860px] border-collapse text-sm">
          <thead>
            <tr className="border-b-[0.5px] border-neutral-200 text-left text-xs font-medium text-neutral-400">
              <th className="py-2 pr-3">Data</th>
              <th className="py-2 pr-3">Cliente</th>
              <th className="py-2 pr-3">Empreendimento/Imóvel</th>
              <th className="py-2 pr-3">Unidade</th>
              <th className="py-2 pr-3">Corretor</th>
              <th className="py-2 pr-3">Equipe</th>
              <th className="py-2 pr-3 text-right">VGV</th>
              <th className="py-2 pr-3 text-right">Comissão</th>
              <th className="py-2 pr-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {pageItems.map((sale) => {
              const statusMeta = SALE_STATUS_META[sale.status]
              return (
                <tr key={sale.id} className="border-b-[0.5px] border-neutral-100 last:border-0">
                  <td className="py-3 pr-3 whitespace-nowrap text-neutral-600">{formatDate(sale.soldAt)}</td>
                  <td className="py-3 pr-3 whitespace-nowrap">
                    {sale.leadId ? (
                      <Link href={`/leads/${sale.leadId}`} className="font-medium text-brand hover:text-brand-dark">
                        {sale.leadName}
                      </Link>
                    ) : (
                      <span className="text-neutral-900">{sale.leadName}</span>
                    )}
                  </td>
                  <td className="py-3 pr-3 whitespace-nowrap text-neutral-900">{sale.propertyTitle}</td>
                  <td className="py-3 pr-3 whitespace-nowrap text-neutral-600">{sale.unitIdentifier}</td>
                  <td className="py-3 pr-3 whitespace-nowrap text-neutral-600">{sale.brokerName}</td>
                  <td className="py-3 pr-3 whitespace-nowrap text-neutral-600">{sale.teamName}</td>
                  <td className="py-3 pr-3 whitespace-nowrap text-right font-medium text-neutral-900">
                    {formatCurrency(sale.saleValue)}
                  </td>
                  <td className="py-3 pr-3 whitespace-nowrap text-right text-neutral-600">
                    {formatCurrency(sale.commissionValue ?? 0)}
                  </td>
                  <td className="py-3 pr-3 whitespace-nowrap">
                    <span
                      className="rounded-full px-2.5 py-1 text-xs font-medium"
                      style={{ backgroundColor: statusMeta.bg, color: statusMeta.text }}
                    >
                      {statusMeta.label}
                    </span>
                  </td>
                </tr>
              )
            })}

            {pageItems.length === 0 && (
              <tr>
                <td colSpan={9} className="py-8 text-center text-sm text-neutral-400">
                  Nenhuma venda encontrada.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-4 flex items-center justify-between gap-2">
        <button
          type="button"
          disabled={currentPage === 1}
          onClick={() => setPage((current) => Math.max(1, current - 1))}
          className="rounded-[8px] border-[1.5px] border-neutral-200 px-3 py-1.5 text-sm font-medium text-neutral-600 transition-colors hover:border-brand hover:text-brand disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-neutral-200 disabled:hover:text-neutral-600"
        >
          Anterior
        </button>
        <span className="text-xs text-neutral-400">
          Página {currentPage} de {totalPages}
        </span>
        <button
          type="button"
          disabled={currentPage === totalPages}
          onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
          className="rounded-[8px] border-[1.5px] border-neutral-200 px-3 py-1.5 text-sm font-medium text-neutral-600 transition-colors hover:border-brand hover:text-brand disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-neutral-200 disabled:hover:text-neutral-600"
        >
          Próximo
        </button>
      </div>
      </>
      )}
    </div>
  )
}
