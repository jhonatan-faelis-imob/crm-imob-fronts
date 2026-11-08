import api from '@/lib/api'
import type {
  AiDescribeRequest,
  AiDescribeResponse,
  PortalConfig,
  PortalReadiness,
  PortalReadinessDraft,
} from '@/features/empreendimentos/portal/types'

export const propertiesService = {
  findAll: async (params?: Record<string, string>) => {
    const { data } = await api.get('/properties', { params })
    return data
  },
  findById: async (id: string) => {
    const { data } = await api.get(`/properties/${id}`)
    return data
  },
  create: async (dto: Record<string, unknown>) => {
    const { data } = await api.post('/properties', dto)
    return data
  },
  update: async (id: string, dto: Record<string, unknown>) => {
    const { data } = await api.patch(`/properties/${id}`, dto)
    return data
  },
  findByIncome: async (income: number) => {
    const { data } = await api.get(`/properties/income-match/${income}`)
    return data
  },
  deactivate: async (id: string) => {
    const { data } = await api.delete(`/properties/${id}`)
    return data
  },
  linkLead: async (propertyId: string, leadId: string, notes?: string) => {
    const { data } = await api.post(`/properties/${propertyId}/leads/${leadId}`, { notes })
    return data
  },
  unlinkLead: async (propertyId: string, leadId: string) => {
    const { data } = await api.delete(`/properties/${propertyId}/leads/${leadId}`)
    return data
  },
  /** Dica do próximo código automático (não reserva nada) */
  getNextCode: async () => {
    const { data } = await api.get<{ hint: string }>('/properties/next-code')
    return data
  },
  getPortalConfig: async () => {
    const { data } = await api.get<PortalConfig>('/properties/portal-config')
    return data
  },
  /** Avalia o rascunho do formulário; não grava nada */
  checkReadiness: async (draft: PortalReadinessDraft) => {
    const { data } = await api.post<PortalReadiness>('/properties/portal-readiness', draft)
    return data
  },
  aiDescribe: async (request: AiDescribeRequest) => {
    const { data } = await api.post<AiDescribeResponse>('/properties/ai/describe', request)
    return data
  },
}
