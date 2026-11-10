import api from '@/lib/api'

export type IntegrationProvider = 'google_ads' | 'ai' | 'grupo_olx' | 'chaves_na_mao' | 'meta'
export type IntegrationGroup = 'portais' | 'anuncios' | 'ia'
export type IntegrationStatus = 'desativada' | 'aguardando' | 'ativa' | 'erro' | 'em_breve'
export type IntegrationEventStatus = 'ok' | 'ignorado' | 'erro' | 'teste'

export interface IntegrationCatalogItem {
  provider: IntegrationProvider
  group: IntegrationGroup
  name: string
  description: string
  status: IntegrationStatus
  enabled: boolean
  lastEventAt: string | null
  lastError: string | null
  requirements: string[]
}

export interface IntegrationEvent {
  id: string
  kind: string
  status: IntegrationEventStatus
  summary: string
  leadId: string | null
  createdAt: string
}

export interface IntakeConfig {
  assignment: { userIds: string[] }
  createFirstContactTask: boolean
  firstContactMinutes: number
}

// A API nunca devolve a chave completa nestas respostas, só keyMasked (••••a1b2)
export interface GoogleAdsView {
  provider: 'google_ads'
  enabled: boolean
  status: IntegrationStatus
  webhookUrl: string | null
  keyMasked: string | null
  publicUrlConfigured: boolean
  secretsError: string | null
  config: IntakeConfig
  lastEventAt: string | null
  lastError: string | null
}

export interface IntakeConfigDto {
  assignment?: { userIds: string[] }
  createFirstContactTask?: boolean
  firstContactMinutes?: number
}

export interface AiSettings {
  provider: 'ai'
  enabled: boolean
  useOwnKey: boolean
  features: { leadScore: boolean; propertyCopy: boolean }
  status: IntegrationStatus
  hasOwnKey: boolean
  keyMasked: string | null
  systemKeyConfigured: boolean
  model: string
  secretsError: string | null
  lastEventAt: string | null
  lastError: string | null
}

export interface UpdateAiSettingsDto {
  enabled?: boolean
  useOwnKey?: boolean
  features?: { leadScore?: boolean; propertyCopy?: boolean }
}

export const integrationsService = {
  catalog: async (): Promise<IntegrationCatalogItem[]> => {
    const { data } = await api.get<IntegrationCatalogItem[]>('/integrations')
    return data
  },
  events: async (provider: IntegrationProvider, limit = 50): Promise<IntegrationEvent[]> => {
    const { data } = await api.get<IntegrationEvent[]>(`/integrations/${provider}/events`, { params: { limit } })
    return data
  },

  googleAds: {
    get: async (): Promise<GoogleAdsView> => {
      const { data } = await api.get<GoogleAdsView>('/integrations/google-ads')
      return data
    },
    enable: async (dto: IntakeConfigDto = {}): Promise<GoogleAdsView> => {
      const { data } = await api.post<GoogleAdsView>('/integrations/google-ads/enable', dto)
      return data
    },
    update: async (dto: IntakeConfigDto): Promise<GoogleAdsView> => {
      const { data } = await api.patch<GoogleAdsView>('/integrations/google-ads', dto)
      return data
    },
    disable: async (): Promise<GoogleAdsView> => {
      const { data } = await api.post<GoogleAdsView>('/integrations/google-ads/disable')
      return data
    },
    // Única chamada que traz a chave completa (fica registrado quem consultou)
    revealKey: async (): Promise<string> => {
      const { data } = await api.get<{ key: string }>('/integrations/google-ads/secret')
      return data.key
    },
    rotateKey: async (): Promise<GoogleAdsView & { message: string }> => {
      const { data } = await api.post<GoogleAdsView & { message: string }>('/integrations/google-ads/rotate-key')
      return data
    },
  },

  ai: {
    get: async (): Promise<AiSettings> => {
      const { data } = await api.get<AiSettings>('/integrations/ai')
      return data
    },
    update: async (dto: UpdateAiSettingsDto): Promise<AiSettings> => {
      const { data } = await api.patch<AiSettings>('/integrations/ai', dto)
      return data
    },
    saveKey: async (apiKey: string): Promise<AiSettings> => {
      const { data } = await api.put<AiSettings>('/integrations/ai/key', { apiKey })
      return data
    },
    removeKey: async (): Promise<AiSettings> => {
      const { data } = await api.delete<AiSettings>('/integrations/ai/key')
      return data
    },
    test: async (): Promise<{ ok: boolean; message: string }> => {
      const { data } = await api.post<{ ok: boolean; message: string }>('/integrations/ai/test')
      return data
    },
  },
}
