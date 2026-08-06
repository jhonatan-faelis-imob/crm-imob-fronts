'use client'
import { useIsFetching, useIsMutating } from '@tanstack/react-query'

export function GlobalLoading() {
  const isFetching = useIsFetching()
  const isMutating = useIsMutating()
  const isLoading = isFetching > 0 || isMutating > 0

  if (!isLoading) return null

  return (
    <div className="fixed inset-0 z-[9999] pointer-events-none flex items-center justify-center">
      {isMutating > 0 && (
        <div className="absolute inset-0 bg-black/10 pointer-events-auto" />
      )}

      <div className="relative bg-white rounded-2xl shadow-lg px-6 py-4 flex items-center gap-3 border border-neutral-200">
        <div className="w-5 h-5 border-2 border-neutral-200 border-t-brand rounded-full animate-spin flex-shrink-0" />
        <span className="text-sm font-medium text-neutral-600">
          {isMutating > 0 ? 'Salvando...' : 'Carregando...'}
        </span>
      </div>
    </div>
  )
}
