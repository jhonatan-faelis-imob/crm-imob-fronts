import { useQueryClient, type QueryClient } from '@tanstack/react-query'
import type { ApiLead } from '@/features/leads/api-mapper'
import { authService } from '@/services/auth.service'
import { leadsService } from '@/services/leads.service'
import { useAuthStore } from '@/store/auth.store'
import type { MessageContext } from './utils/render-template'

// Dados das variáveis da mensagem: lead (o que está na tela), corretor e imobiliária (usuário logado).
// O telefone do corretor não está na store: vem de GET /auth/me, uma vez. O imóvel vem do lead se a tela
// já tiver (detalhe); senão de GET /leads/:id, silencioso

export interface MessageLead {
  id: string
  name: string
  phone: string
  phone2?: string
  /** undefined = a tela não sabe (busca GET /leads/:id); null = o lead não tem imóvel vinculado */
  firstPropertyTitle?: string | null
}

interface MeResponse {
  name?: string
  phone?: string | null
  organization?: { name?: string } | null
}

const ME_STALE_MS = 30 * 60_000
const LEAD_STALE_MS = 60_000

function meQuery() {
  return { queryKey: ['me'], queryFn: (): Promise<MeResponse> => authService.me(), staleTime: ME_STALE_MS, meta: { silent: true } }
}

function leadQuery(id: string) {
  // Mesma chave do detalhe do lead: reaproveita o cache quando existir
  return { queryKey: ['lead', id], queryFn: (): Promise<ApiLead> => leadsService.findById(id), staleTime: LEAD_STALE_MS, meta: { silent: true } }
}

type LinkedProperty = { createdAt?: string; property?: { title?: string | null } | null }

/** Igual ao backend: o imóvel vinculado há mais tempo */
export function firstPropertyTitle(properties: LinkedProperty[] | undefined): string | null {
  if (!properties?.length) return null
  const sorted = [...properties].sort((a, b) => (a.createdAt ?? '').localeCompare(b.createdAt ?? ''))
  return sorted[0]?.property?.title ?? null
}

async function safely<T>(load: () => Promise<T>): Promise<T | null> {
  try {
    return await load()
  } catch (error) {
    // Sem esses dados a mensagem sai com as variáveis destacadas para completar à mão
    console.error('Mensagem do WhatsApp: falha ao buscar dados das variáveis', error)
    return null
  }
}

export function prefetchMessageContext(queryClient: QueryClient, lead: MessageLead) {
  void queryClient.prefetchQuery(meQuery())
  if (lead.firstPropertyTitle === undefined) void queryClient.prefetchQuery(leadQuery(lead.id))
}

// lead null (simulador sem lead): só corretor, imobiliária e saudação
export function useMessageContext(lead: MessageLead | null) {
  const queryClient = useQueryClient()
  const user = useAuthStore((state) => state.user)

  async function load(): Promise<MessageContext> {
    const needsLead = !!lead && lead.firstPropertyTitle === undefined
    const [me, apiLead] = await Promise.all([
      safely(() => queryClient.ensureQueryData(meQuery())),
      needsLead ? safely(() => queryClient.ensureQueryData(leadQuery(lead.id))) : null,
    ])
    return {
      leadName: lead?.name ?? '',
      propertyTitle: needsLead
        ? firstPropertyTitle(apiLead?.properties as LinkedProperty[] | undefined)
        : lead?.firstPropertyTitle,
      brokerName: me?.name ?? user?.name,
      brokerPhone: me?.phone,
      agencyName: me?.organization?.name ?? user?.organization?.name,
    }
  }

  return { prefetch: () => (lead ? prefetchMessageContext(queryClient, lead) : undefined), load }
}
