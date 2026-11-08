import type { CadenceResult, CadenceStep } from '@/types'

export const MAX_STEPS_PER_STAGE = 8
export const MAX_STEP_TITLE_LENGTH = 120

const BUSINESS_TIME_ZONE = 'America/Sao_Paulo'
// Igual ao backend (cadence-date.ts): passo de hoje com horário vencido nasce para daqui a 30 min
const LATE_SAME_DAY_MINUTES = 30

const MANAGE_ROLES = new Set(['gerente', 'diretor'])

export function canManageCadences(user: { role: string } | null | undefined) {
  return !!user && MANAGE_ROLES.has(user.role)
}

export function formatOffset(days: number) {
  if (days === 0) return 'No mesmo dia'
  return `+${days} ${days === 1 ? 'dia' : 'dias'}`
}

// Na dica do Kanban as variáveis viram texto legível para quem não edita a cadência
export function readableStepTitle(title: string) {
  return title.replace(/\{\{\s*(primeiro_nome|nome)\s*\}\}/g, 'cliente')
}

function plural(count: number, singular: string, pluralText: string) {
  return `${count} ${count === 1 ? singular : pluralText}`
}

export function cadenceToastDescription(cadence: CadenceResult | undefined) {
  if (!cadence) return undefined
  const parts: string[] = []
  if (cadence.created.length > 0) {
    parts.push(`Criei ${plural(cadence.created.length, 'tarefa', 'tarefas')} de acompanhamento.`)
  }
  if (cadence.cancelled > 0) {
    parts.push(
      cadence.cancelled === 1
        ? '1 tarefa da etapa anterior foi cancelada.'
        : `${cadence.cancelled} tarefas da etapa anterior foram canceladas.`,
    )
  }
  return parts.length ? parts.join(' ') : undefined
}

function businessDay(now: Date) {
  return new Intl.DateTimeFormat('en-CA', { timeZone: BUSINESS_TIME_ZONE }).format(now)
}

function addDays(day: string, days: number) {
  const date = new Date(`${day}T12:00:00.000Z`)
  date.setUTCDate(date.getUTCDate() + days)
  return date.toISOString().slice(0, 10)
}

// Mesmo cálculo de CadencesService, só para a prévia do formulário
export function previewDueDate(
  step: Pick<CadenceStep, 'offsetDays' | 'dueTime' | 'skipWeekends'>,
  now = new Date(),
): string {
  let day = addDays(businessDay(now), step.offsetDays)
  if (step.skipWeekends) {
    const weekday = new Date(`${day}T12:00:00.000Z`).getUTCDay()
    if (weekday === 6) day = addDays(day, 2)
    if (weekday === 0) day = addDays(day, 1)
  }

  const nowTime = new Intl.DateTimeFormat('pt-BR', {
    timeZone: BUSINESS_TIME_ZONE,
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).format(now)

  let time = step.dueTime
  if (step.offsetDays === 0 && day === businessDay(now) && step.dueTime <= nowTime) {
    time = new Intl.DateTimeFormat('pt-BR', {
      timeZone: BUSINESS_TIME_ZONE,
      hour: '2-digit',
      minute: '2-digit',
      hourCycle: 'h23',
    }).format(new Date(now.getTime() + LATE_SAME_DAY_MINUTES * 60_000))
  }

  const label = new Intl.DateTimeFormat('pt-BR', {
    timeZone: 'UTC',
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date(`${day}T12:00:00.000Z`))

  return `${label}, às ${time}`
}
