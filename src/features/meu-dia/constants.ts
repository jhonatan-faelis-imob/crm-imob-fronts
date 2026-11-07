import { toLocalISODate } from '@/lib/date'
import type { MyDayBand, MyDayCounts, MyDayReason, MyDayReasonCode, MyDayTask } from '@/types'

export const PAGE_SIZE = 40
// Igual ao MAX_ITEMS de my-day.config.ts na API
export const MAX_ITEMS = 100

export const BANDS: { value: MyDayBand; title: string }[] = [
  { value: 'agora', title: 'Fazer agora' },
  { value: 'hoje', title: 'Ainda hoje' },
  { value: 'atencao', title: 'Para não deixar esfriar' },
]

export type MyDayFilter = MyDayReasonCode | 'todos'

export const FILTERS: { value: MyDayFilter; label: string; count: keyof MyDayCounts }[] = [
  { value: 'todos', label: 'Todos', count: 'total' },
  { value: 'tarefa_vencida', label: 'Atrasadas', count: 'tarefaVencida' },
  { value: 'tarefa_hoje', label: 'Hoje', count: 'tarefaHoje' },
  { value: 'sem_contato', label: 'Sem contato', count: 'semContato' },
  { value: 'sem_proxima_tarefa', label: 'Sem próxima tarefa', count: 'semProximaTarefa' },
  { value: 'urgencia_imediata', label: 'Urgência imediata', count: 'urgenciaImediata' },
  { value: 'primeiro_contato', label: 'Primeiro contato', count: 'primeiroContato' },
]

export const SEVERITY_CLASS_NAME: Record<MyDayReason['severity'], string> = {
  critical: 'bg-[#FFEBEE] text-danger',
  warning: 'bg-[#FFF3E0] text-warning',
  info: 'bg-neutral-100 text-neutral-600',
}

export const RETURN_OPTIONS: { label: string; days?: number; months?: number }[] = [
  { label: 'Amanhã', days: 1 },
  { label: 'Em 3 dias', days: 3 },
  { label: 'Em 1 semana', days: 7 },
  { label: 'Em 1 mês', months: 1 },
]

export function returnDate({ days = 0, months = 0 }: { days?: number; months?: number }) {
  const today = new Date()
  return new Date(today.getFullYear(), today.getMonth() + months, today.getDate() + days, 9, 0)
}

function daysUntilNextMonday() {
  return (8 - new Date().getDay()) % 7 || 7
}

export const POSTPONE_OPTIONS: { label: string; days: () => number }[] = [
  { label: '+1 dia', days: () => 1 },
  { label: '+3 dias', days: () => 3 },
  { label: 'Próxima segunda', days: daysUntilNextMonday },
]

// Conta a partir de hoje: somar à data original deixaria uma tarefa antiga ainda vencida
export function postponedDate(task: MyDayTask, days: number) {
  const today = new Date()
  const due = new Date(task.dueDate)
  return new Date(today.getFullYear(), today.getMonth(), today.getDate() + days, due.getHours(), due.getMinutes())
}

export function isDueByToday(task: MyDayTask) {
  return toLocalISODate(new Date(task.dueDate)) <= toLocalISODate()
}

export function formatTaskDate(dueDate: string) {
  const date = new Date(dueDate)
  const time = new Intl.DateTimeFormat('pt-BR', { hour: '2-digit', minute: '2-digit' }).format(date)
  if (toLocalISODate(date) === toLocalISODate()) return `Hoje, ${time}`

  const day = new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit' }).format(date)
  return `${day}, ${time}`
}

export function greeting(hour: number) {
  if (hour < 12) return 'Bom dia'
  return hour < 18 ? 'Boa tarde' : 'Boa noite'
}

export function firstName(name: string) {
  return name.trim().split(/\s+/)[0]
}
