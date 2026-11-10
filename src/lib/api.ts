import axios from 'axios'
import { useAuthStore } from '@/store/auth.store'
import { API_BASE_URL } from './api-base-url'
import { isAuthEndpoint, markSessionExpired } from './session-expired'

// Fallback explícito para produção caso variável não seja injetada (ver api-base-url.ts)
const BASE_URL = API_BASE_URL

const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
})

api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('accessToken')
    if (token) config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config
    // 401 no login é senha errada, não sessão vencida: quem chamou trata
    if (error.response?.status === 401 && original && !original._retry && !isAuthEndpoint(original.url)) {
      original._retry = true
      try {
        const refreshToken = localStorage.getItem('refreshToken')
        if (!refreshToken) throw new Error('No refresh token')
        const { data } = await axios.post(`${BASE_URL}/auth/refresh`, { refreshToken })
        useAuthStore.getState().setTokens(data.accessToken, data.refreshToken)
        original.headers.Authorization = `Bearer ${data.accessToken}`
        return api(original)
      } catch {
        // Senha trocada em outro aparelho, perfil editado, usuário desativado ou refresh vencido
        markSessionExpired()
        // Limpa também o cookie, senão o middleware devolveria /login para o dashboard
        useAuthStore.getState().clearAuth()
        window.location.href = '/login'
      }
    }
    return Promise.reject(error)
  }
)

export default api
