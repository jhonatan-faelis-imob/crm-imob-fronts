import api from '@/lib/api'
import { API_BASE_URL } from '@/lib/api-base-url'
import type {
  CreatedPropertyShare,
  PropertyShare,
  PublicPropertyShare,
  UnavailablePropertyShare,
} from '@/types'

export interface CreatePropertyShareInput {
  propertyId: string
  leadId?: string
  expiresInDays?: 7 | 30 | 90
  showPrice?: boolean
}

export interface MarkSentResult {
  sentAt: string
  interactionCreated: boolean
  linked: boolean
}

export type PublicShareResult =
  | { kind: 'ok'; share: PublicPropertyShare | UnavailablePropertyShare }
  | { kind: 'not-found' }
  | { kind: 'expired' }
  | { kind: 'error' }

export const propertySharesService = {
  create: async (input: CreatePropertyShareInput) => {
    const { data } = await api.post<CreatedPropertyShare>('/property-shares', input)
    return data
  },
  list: async (propertyId: string) => {
    const { data } = await api.get<PropertyShare[]>('/property-shares', { params: { propertyId } })
    return data
  },
  revoke: async (id: string) => {
    const { data } = await api.post<{ id: string; revokedAt: string }>(`/property-shares/${id}/revoke`)
    return data
  },
  markSent: async (id: string, channel: 'whatsapp' | 'link', linkToLead?: boolean) => {
    const { data } = await api.post<MarkSentResult>(`/property-shares/${id}/mark-sent`, { channel, linkToLead })
    return data
  },

  // ---- Públicos: fetch puro, sem o api.ts (o interceptor de 401 mandaria o cliente para o login) ----

  /** Usado no servidor (página /i/[token]). Sem cache: revogar ou vender reflete na hora */
  getPublic: async (token: string): Promise<PublicShareResult> => {
    try {
      const response = await fetch(`${API_BASE_URL}/public/shares/${encodeURIComponent(token)}`, {
        cache: 'no-store',
        headers: { Accept: 'application/json' },
      })
      if (response.status === 404) return { kind: 'not-found' }
      if (response.status === 410) return { kind: 'expired' }
      if (!response.ok) return { kind: 'error' }
      return { kind: 'ok', share: (await response.json()) as PublicPropertyShare | UnavailablePropertyShare }
    } catch {
      return { kind: 'error' }
    }
  },

  /** Conta a visita. keepalive: termina mesmo se a pessoa fechar a aba logo em seguida */
  recordView: (token: string) =>
    fetch(`${API_BASE_URL}/public/shares/${encodeURIComponent(token)}/view`, {
      method: 'POST',
      keepalive: true,
    }).catch(() => undefined),
}
