import { useQuery } from '@tanstack/react-query'
import { isAxiosError } from 'axios'
import { propertiesService } from '@/services/properties.service'
import type { PortalConfig, PortalPropertyType } from './types'

/** Regras dos portais vindas da API. Quase nunca mudam: cache sem expiração na sessão */
export function usePortalConfig() {
  return useQuery({
    queryKey: ['portal-config'],
    queryFn: propertiesService.getPortalConfig,
    staleTime: Infinity,
    meta: { silent: true },
  })
}

export function findPortalType(config: PortalConfig | undefined, value: string | undefined): PortalPropertyType | undefined {
  if (!config || !value) return undefined
  return config.types.find((type) => type.value === value)
}

export function portalTypeLabel(config: PortalConfig | undefined, value: string | undefined) {
  if (!value) return undefined
  return findPortalType(config, value)?.label ?? value
}

/** Mensagem da API (string ou lista do class-validator) e, no 400 dos portais, o que falta */
export function apiErrorDetails(error: unknown): { message?: string; missing: string[] } {
  if (!isAxiosError(error)) return { missing: [] }
  const data: unknown = error.response?.data
  if (typeof data !== 'object' || data === null) return { missing: [] }
  const body = data as { message?: unknown; missing?: unknown }
  const message = Array.isArray(body.message)
    ? body.message.filter((item): item is string => typeof item === 'string').join(' · ')
    : typeof body.message === 'string'
      ? body.message
      : undefined
  const missing = Array.isArray(body.missing) ? body.missing.filter((item): item is string => typeof item === 'string') : []
  return { message, missing }
}
