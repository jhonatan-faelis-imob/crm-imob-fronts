'use client'

import { useQuery } from '@tanstack/react-query'
import { Lock } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { EmptyState } from '@/components/ui/empty-state'
import { Skeleton } from '@/components/ui/skeleton'
import { AiPanel } from '@/features/integracoes/components/ai-panel'
import { ComingSoonPanel } from '@/features/integracoes/components/coming-soon-panel'
import { GoogleAdsPanel } from '@/features/integracoes/components/google-ads-panel'
import { IntegrationCard } from '@/features/integracoes/components/integration-card'
import { canManageIntegrations, GROUPS, INTEGRATIONS_QUERY_KEY } from '@/features/integracoes/constants'
import { useHydrated } from '@/lib/use-hydrated'
import { integrationsService, type IntegrationCatalogItem, type IntegrationProvider } from '@/services/integrations.service'
import { useAuthStore } from '@/store/auth.store'

export default function IntegracoesPage() {
  const router = useRouter()
  const isHydrated = useHydrated()
  const user = useAuthStore((state) => state.user)
  const canManage = canManageIntegrations(user)
  const [openProvider, setOpenProvider] = useState<IntegrationProvider | null>(null)
  const [comingSoon, setComingSoon] = useState<IntegrationCatalogItem | null>(null)

  const { data: items, isLoading, isError } = useQuery({
    queryKey: INTEGRATIONS_QUERY_KEY,
    queryFn: integrationsService.catalog,
    enabled: isHydrated && canManage,
  })

  function open(item: IntegrationCatalogItem) {
    if (item.status === 'em_breve') setComingSoon(item)
    else setOpenProvider(item.provider)
  }

  if (!isHydrated) return <Skeleton className="h-64 rounded-[16px]" />

  if (!canManage) {
    return (
      <EmptyState
        icon={<Lock className="h-6 w-6" />}
        title="Acesso restrito"
        description="Só gerentes e diretores configuram as integrações da imobiliária."
        action={{ label: 'Voltar para Leads', onClick: () => router.push('/leads') }}
      />
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-medium text-neutral-400">Configurações</p>
        <h1 className="text-[28px] font-semibold text-neutral-900">Integrações</h1>
        <p className="mt-1 max-w-2xl text-sm text-neutral-400">
          Conecte o CRM aos canais de onde vêm os seus leads e configure a inteligência artificial.
        </p>
      </div>

      {isLoading ? (
        <div className="space-y-6">
          {GROUPS.map((group) => (
            <div key={group.value} className="space-y-3">
              <Skeleton className="h-5 w-48 rounded-[8px]" />
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <Skeleton className="h-36 rounded-[16px]" />
                <Skeleton className="h-36 rounded-[16px]" />
              </div>
            </div>
          ))}
        </div>
      ) : isError || !items ? (
        <p className="rounded-[16px] border-[0.5px] border-neutral-200 bg-white p-6 text-center text-sm text-danger">
          Não foi possível carregar as integrações.
        </p>
      ) : (
        GROUPS.map((group) => {
          const groupItems = items.filter((item) => item.group === group.value)
          if (!groupItems.length) return null
          return (
            <section key={group.value} className="space-y-3">
              <h2 className="text-base font-semibold text-neutral-900">{group.label}</h2>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {groupItems.map((item) => (
                  <IntegrationCard key={item.provider} item={item} onOpen={() => open(item)} />
                ))}
              </div>
            </section>
          )
        })
      )}

      <GoogleAdsPanel open={openProvider === 'google_ads'} onOpenChange={(value) => !value && setOpenProvider(null)} />
      <AiPanel open={openProvider === 'ai'} onOpenChange={(value) => !value && setOpenProvider(null)} />
      <ComingSoonPanel item={comingSoon} onOpenChange={(value) => !value && setComingSoon(null)} />
    </div>
  )
}
