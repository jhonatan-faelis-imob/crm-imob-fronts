import api from '@/lib/api'

export const goalsService = {
  findAll: async () => {
    const { data } = await api.get('/goals')
    return data
  },
  findById: async (id: string) => {
    const { data } = await api.get(`/goals/${id}`)
    return data
  },
  create: async (dto: Record<string, unknown>) => {
    const { data } = await api.post('/goals', dto)
    return data
  },
  update: async (id: string, dto: Record<string, unknown>) => {
    const { data } = await api.patch(`/goals/${id}`, dto)
    return data
  },
  upsertDailyEntry: async (goalId: string, dto: Record<string, unknown>) => {
    const { data } = await api.post(`/goals/${goalId}/entries`, dto)
    return data
  },
  getEntries: async (goalId: string) => {
    const { data } = await api.get(`/goals/${goalId}/entries`)
    return data
  },
  updateProgress: async (goalId: string) => {
    const { data } = await api.patch(`/goals/${goalId}/progress`)
    return data
  },
}
