import api from '@/lib/api'
import type { MyDayResponse, MyDaySummary } from '@/types'

export const myDayService = {
  get: async (params?: { limit?: number; userId?: string }) => {
    const { data } = await api.get<MyDayResponse>('/my-day', { params })
    return data
  },
  getSummary: async () => {
    const { data } = await api.get<MyDaySummary>('/my-day/summary')
    return data
  },
}
