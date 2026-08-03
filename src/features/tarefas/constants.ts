import { Home, Mail, MessageCircle, MoreHorizontal, Phone, Users, type LucideIcon } from 'lucide-react'
import type { TaskPriority, TaskStatus, TaskType } from '@/types'

export const TASK_TYPES: TaskType[] = ['ligacao', 'whatsapp', 'email', 'visita', 'reuniao', 'outro']

export const TASK_TYPE_META: Record<TaskType, { label: string; icon: LucideIcon; bg: string; text: string }> = {
  ligacao: { label: 'Ligação', icon: Phone, bg: '#EBF5FF', text: '#0070F3' },
  whatsapp: { label: 'WhatsApp', icon: MessageCircle, bg: '#E8F5E9', text: '#008A05' },
  email: { label: 'Email', icon: Mail, bg: '#F3E8FF', text: '#7C3AED' },
  visita: { label: 'Visita', icon: Home, bg: '#FFF3E0', text: '#C45800' },
  reuniao: { label: 'Reunião', icon: Users, bg: '#FFF0F2', text: '#FF385C' },
  outro: { label: 'Outro', icon: MoreHorizontal, bg: '#F7F7F7', text: '#767676' },
}

export const TASK_PRIORITIES: TaskPriority[] = ['alta', 'media', 'baixa']

export const PRIORITY_META: Record<TaskPriority, { label: string; bg: string; text: string }> = {
  alta: { label: 'Alta', bg: '#FFEBEE', text: '#D93B30' },
  media: { label: 'Média', bg: '#FFF3E0', text: '#C45800' },
  baixa: { label: 'Baixa', bg: '#F7F7F7', text: '#767676' },
}

export const TASK_STATUSES: TaskStatus[] = ['pendente', 'concluida', 'cancelada']

export const STATUS_FILTER_META: Record<TaskStatus, string> = {
  pendente: 'Pendentes',
  concluida: 'Concluídas',
  cancelada: 'Canceladas',
}
