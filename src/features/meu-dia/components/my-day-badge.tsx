'use client'

import { useQuery } from '@tanstack/react-query'
import { cn } from '@/lib/utils'
import { myDayService } from '@/services/my-day.service'

// Só depende da query, que roda depois de montar: o HTML do servidor e o do cliente coincidem
export function MyDayBadge({ className }: { className?: string }) {
  const { data } = useQuery({
    queryKey: ['my-day-summary'],
    queryFn: myDayService.getSummary,
    staleTime: 60_000,
    refetchInterval: 5 * 60_000,
  })

  const count = data?.counts.agora ?? 0
  if (count === 0) return null

  return (
    <span
      aria-label={`${count} para fazer agora`}
      className={cn(
        'flex h-5 min-w-5 items-center justify-center rounded-full bg-danger px-1 text-[11px] font-semibold text-white',
        className,
      )}
    >
      {count > 99 ? '99+' : count}
    </span>
  )
}
