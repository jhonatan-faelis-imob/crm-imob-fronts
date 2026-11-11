'use client'

import { AlertTriangle, Lock } from 'lucide-react'
import { useHydrated } from '@/lib/use-hydrated'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/store/auth.store'
import { supportWhatsappUrl } from './constants'
import { useBillingMe } from './use-billing-me'

/** Faixa fixa acima do conteúdo: âmbar (teste acabando, atrasada) ou vermelha (bloqueada, somente leitura) */
export function SubscriptionBanner() {
  const isHydrated = useHydrated()
  const isLogged = useAuthStore((state) => !!state.accessToken)
  const { data } = useBillingMe(isHydrated && isLogged)
  if (!data?.warning) return null

  const blocked = data.warningLevel === 'bloqueio'
  const support = supportWhatsappUrl()
  const Icon = blocked ? Lock : AlertTriangle

  return (
    <div
      role="status"
      className={cn(
        'flex shrink-0 items-start gap-2 px-4 py-2.5 text-sm sm:items-center',
        blocked ? 'bg-danger text-white' : 'bg-warning/15 text-warning',
      )}
    >
      <Icon className="mt-0.5 h-4 w-4 shrink-0 sm:mt-0" />
      <p className="min-w-0 flex-1">{data.warning}</p>
      {support && (
        <a
          href={support}
          target="_blank"
          rel="noopener noreferrer"
          className={cn('shrink-0 font-semibold underline underline-offset-2', blocked ? 'text-white' : 'text-warning')}
        >
          Falar com o suporte
        </a>
      )}
    </div>
  )
}
