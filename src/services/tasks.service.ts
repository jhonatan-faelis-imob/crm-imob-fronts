import api from '@/lib/api'

export const tasksService = {
  findAll: async (params?: Record<string, string>) => {
    const { data } = await api.get('/tasks', { params })
    return data
  },
  create: async (dto: Record<string, unknown>) => {
    const { data } = await api.post('/tasks', dto)
    return data
  },
  update: async (id: string, dto: Record<string, unknown>) => {
    const { data } = await api.patch(`/tasks/${id}`, dto)
    return data
  },
  complete: async (id: string, dto: Record<string, unknown>) => {
    const { data } = await api.patch(`/tasks/${id}/complete`, dto)
    return data
  },
  cancel: async (id: string) => {
    const { data } = await api.patch(`/tasks/${id}/cancel`)
    return data
  },
  getSummary: async () => {
    const { data } = await api.get('/tasks/summary')
    return data
  },
}
