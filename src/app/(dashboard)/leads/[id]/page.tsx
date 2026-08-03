'use client'

import { useParams } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { Skeleton } from '@/components/ui/skeleton'
import { leadsService } from '@/services/leads.service'
import { mapApiLeadToLead, type ApiLead } from '@/features/leads/api-mapper'
import { LeadDetailPage } from '@/features/leads/components/detail/lead-detail-page'

export default function LeadPage() {
  const { id } = useParams<{ id: string }>()

  const { data: apiLead, isLoading, isError } = useQuery<ApiLead>({
    queryKey: ['lead', id],
    queryFn: () => leadsService.findById(id),
  })

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-24 w-full rounded-[16px]" />
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <Skeleton className="h-96 rounded-[16px] lg:col-span-2" />
          <Skeleton className="h-96 rounded-[16px] lg:col-span-1" />
        </div>
      </div>
    )
  }

  if (isError || !apiLead) {
    return (
      <div className="rounded-[16px] border-[0.5px] border-neutral-200 bg-white p-8 text-center">
        <p className="text-sm font-medium text-neutral-900">Lead não encontrado.</p>
      </div>
    )
  }

  return <LeadDetailPage lead={mapApiLeadToLead(apiLead)} apiLead={apiLead} />
}
