import api from '@/lib/api'

export const salesService = {
  findAll: async (params?: Record<string, string>) => {
    const { data } = await api.get('/sales', { params })
    return data
  },
  getSummary: async (startDate?: string, endDate?: string) => {
    const { data } = await api.get('/sales/summary', { params: { startDate, endDate } })
    return data
  },
}
