import api from '@/lib/api'
import type { ApiAutoFill, ApiGoalEntry, ApiGoalSummary } from '@/features/metas/api'

export const goalsService = {
  findAll: async () => {
    const { data } = await api.get('/goals')
    return data
  },
  findById: async (id: string) => {
    const { data } = await api.get(`/goals/${id}`)
    return data
  },
  getSummary: async (id: string): Promise<ApiGoalSummary> => {
    const { data } = await api.get(`/goals/${id}/summary`)
    return data
  },
  getAutoFill: async (date: string): Promise<ApiAutoFill> => {
    const { data } = await api.get('/goals/auto-fill', { params: { date } })
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
  getEntries: async (goalId: string, range: { from: string; to: string }): Promise<ApiGoalEntry[]> => {
    const { data } = await api.get(`/goals/${goalId}/entries`, { params: range })
    return data
  },
  remove: async (goalId: string) => {
    const { data } = await api.delete(`/goals/${goalId}`)
    return data
  },
  updateProgress: async (goalId: string) => {
    const { data } = await api.patch(`/goals/${goalId}/progress`)
    return data
  },
}
