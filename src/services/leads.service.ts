import api from '@/lib/api'

export const leadsService = {
  findAll: async (params?: Record<string, string>) => {
    const { data } = await api.get('/leads', { params })
    return data
  },
  findById: async (id: string) => {
    const { data } = await api.get(`/leads/${id}`)
    return data
  },
  create: async (dto: Record<string, unknown>) => {
    const { data } = await api.post('/leads', dto)
    return data
  },
  update: async (id: string, dto: Record<string, unknown>) => {
    const { data } = await api.patch(`/leads/${id}`, dto)
    return data
  },
  updateStage: async (id: string, funnelStageId: string) => {
    const { data } = await api.patch(`/leads/${id}/stage`, { funnelStageId })
    return data
  },
  markAsLost: async (id: string, lostReason: string) => {
    const { data } = await api.patch(`/leads/${id}/lost`, { lostReason })
    return data
  },
  archive: async (id: string) => {
    const { data } = await api.delete(`/leads/${id}`)
    return data
  },
  analyzeAI: async (id: string) => {
    const { data } = await api.post(`/ai/leads/${id}/analyze`)
    return data
  },
}
