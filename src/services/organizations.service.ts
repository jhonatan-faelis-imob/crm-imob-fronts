import api from '@/lib/api'

export const organizationsService = {
  onboarding: async (dto: {
    orgName: string
    slug: string
    name: string
    email: string
    phone?: string
    password: string
  }) => {
    const { data } = await api.post('/organizations/onboarding', dto)
    return data
  },
}
