// Base da API. Separado do api.ts para quem não pode passar pelo interceptor de 401 (página pública /i/)
export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || 'https://crm-imob-api-production.up.railway.app/api/v1'
