import { isAxiosError } from 'axios'

export interface StageError {
  status: number | undefined
  /** STAGE_HAS_LEADS, STAGE_IS_TERMINAL, MIN_STAGES... */
  code: string | undefined
  message: string
  /** STAGE_HAS_LEADS: quantos leads a etapa tem agora */
  count: number | undefined
}

export function stageError(error: unknown, fallback: string): StageError {
  if (!isAxiosError(error)) return { status: undefined, code: undefined, message: fallback, count: undefined }
  const data: unknown = error.response?.data
  const record = typeof data === 'object' && data !== null ? (data as Record<string, unknown>) : {}
  const rawMessage = record.message
  const message =
    typeof rawMessage === 'string' ? rawMessage : Array.isArray(rawMessage) && typeof rawMessage[0] === 'string' ? rawMessage[0] : fallback
  return {
    status: error.response?.status,
    code: typeof record.code === 'string' ? record.code : undefined,
    message,
    count: typeof record.count === 'number' ? record.count : undefined,
  }
}
