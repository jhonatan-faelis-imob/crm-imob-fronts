'use client'

import { AlertTriangle, Lock } from 'lucide-react'
import Link from 'next/link'
import { useHydrated } from '@/lib/use-hydrated'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/store/auth.store'
import { supportWhatsappUrl } from './constants'
import { useBillingMe } from './use-billing-me'

/**
 * Faixa fixa acima do conteúdo: âmbar (teste, atrasada, cancelada) ou vermelha (bloqueada, somente leitura).
 * Para o diretor: "Assinar agora" no teste, "Pagar agora" no atraso (fatura em aberto) e "Ver assinatura" no bloqueio
 */
export function SubscriptionBanner() {
  const isHydrated = useHydrated()
  const isLogged = useAuthStore((state) => !!state.accessToken)
  const role = useAuthStore((state) => state.user?.role)
  const { data } = useBillingMe(isHydrated && isLogged)
  if (!data?.warning) return null

  const blocked = data.warningLevel === 'bloqueio'
  const isDirector = role === 'diretor'
  const Icon = blocked ? Lock : AlertTriangle
  const linkClassName = cn('shrink-0 font-semibold underline underline-offset-2', blocked ? 'text-white' : 'text-warning')

  let action: { href: string; label: string; external: boolean } | null = null
  if (isDirector && data.status === 'teste' && !data.hasSubscription) action = { href: '/assinatura', label: 'Assinar agora', external: false }
  else if (isDirector && data.status === 'atrasada' && data.openPayment) {
    action = { href: data.openPayment.invoiceUrl, label: 'Pagar agora', external: true }
  } else if (isDirector && blocked) action = { href: '/assinatura', label: 'Ver assinatura', external: false }
  else {
    const support = supportWhatsappUrl()
    if (support && (blocked || data.status === 'atrasada')) action = { href: support, label: 'Falar com o suporte', external: true }
  }

  return (
    <div
      role="status"
      className={cn(
        'flex shrink-0 items-start gap-2 px-4 py-2.5 text-sm sm:items-center',
        blocked ? 'bg-danger text-white' : 'bg-warning/15 text-warning',
      )}
    >
      <Icon className="mt-0.5 h-4 w-4 shrink-0 sm:mt-0" />
      <p className="min-w-0 flex-1">
        {data.warning}
        {action && !action.external && (
          <>
            {' — '}
            <Link href={action.href} className={linkClassName}>
              {action.label}
            </Link>
          </>
        )}
      </p>
      {action?.external && (
        <a href={action.href} target="_blank" rel="noopener noreferrer" className={linkClassName}>
          {action.label}
        </a>
      )}
    </div>
  )
}
