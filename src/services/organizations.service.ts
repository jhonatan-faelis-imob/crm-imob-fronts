import api from '@/lib/api'

export const organizationsService = {
  onboarding: async (dto: {
    orgName: string
    slug: string
    name: string
    email: string
    phone: string
    /** CPF ou CNPJ */
    document: string
    password: string
    /** Termos de Uso e Política de Privacidade: o backend recusa sem true */
    acceptedTerms: boolean
  }) => {
    const { data } = await api.post('/organizations/onboarding', dto)
    return data
  },
}
