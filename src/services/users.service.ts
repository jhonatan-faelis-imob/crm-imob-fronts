import api from '@/lib/api'

export const usersService = {
  findAll: async (params?: Record<string, string>) => {
    const { data } = await api.get('/users', { params })
    return data
  },
  findById: async (id: string) => {
    const { data } = await api.get(`/users/${id}`)
    return data
  },
  create: async (dto: Record<string, unknown>) => {
    const { data } = await api.post('/users', dto)
    return data
  },
  update: async (id: string, dto: Record<string, unknown>) => {
    const { data } = await api.patch(`/users/${id}`, dto)
    return data
  },
}
