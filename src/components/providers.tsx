'use client'
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClient } from '@/lib/query-client'
import { GlobalLoading } from '@/components/ui/global-loading'

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <GlobalLoading />
      {children}
    </QueryClientProvider>
  )
}
