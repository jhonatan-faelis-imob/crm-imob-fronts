'use client'

import { CheckCircle, Mail, MessageCircle, Pencil, X } from 'lucide-react'
import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import {
  mapApiLeadToLead,
  resolveLeadStage,
  stageBadgeStyle,
  type ApiFunnelStage,
  type ApiLead,
} from '@/features/leads/api-mapper'
import { funnelStagesService } from '@/services/funnel-stages.service'
import { leadsService } from '@/services/leads.service'
import type { Task, TaskStatus } from '@/types'
import { PRIORITY_META, TASK_TYPE_META } from '../constants'
import { formatDateBR, formatTime } from '../date-utils'

const STATUS_META: Record<TaskStatus, { label: string; bg: string; text: string }> = {
  pendente: { label: 'Pendente', bg: '#EBF5FF', text: '#0070F3' },
  concluida: { label: 'Concluída', bg: '#E8F5E9', text: '#008A05' },
  cancelada: { label: 'Cancelada', bg: '#F7F7F7', text: '#767676' },
}

function whatsappUrl(phone: string) {
  const clean = phone.replace(/\D/g, '')
  const number = clean.startsWith('55') ? clean : `55${clean}`
  return `https://wa.me/${number}`
}

function PhoneRow({ phone }: { phone: string }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-sm text-neutral-600">{phone}</span>
      <button
        type="button"
        onClick={() => window.open(whatsappUrl(phone), '_blank')}
        className="flex items-center gap-1 rounded-[8px] bg-[#E8F5E9] px-2 py-1 text-xs font-medium text-success transition-colors hover:bg-[#d3ecd5]"
      >
        <MessageCircle className="h-3 w-3" />
        WhatsApp
      </button>
    </div>
  )
}

export function TaskDetailSheet({
  task,
  open,
  onOpenChange,
  onComplete,
  onEdit,
  onCancel,
}: {
  task: Task | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onComplete: (task: Task) => void
  onEdit: (task: Task) => void
  onCancel: (taskId: string) => void
}) {
  const { data: apiLead } = useQuery<ApiLead>({
    queryKey: ['lead', task?.leadId],
    queryFn: () => leadsService.findById(task!.leadId!),
    enabled: !!task?.leadId && open,
  })

  const { data: stages } = useQuery<ApiFunnelStage[]>({
    queryKey: ['funnel-stages'],
    queryFn: funnelStagesService.findAll,
    enabled: !!task?.leadId && open,
  })

  if (!task) return null

  const typeMeta = TASK_TYPE_META[task.type]
  const TypeIcon = typeMeta.icon
  const priorityMeta = PRIORITY_META[task.priority]
  const statusMeta = STATUS_META[task.status]
  const lead = apiLead ? mapApiLeadToLead(apiLead) : null
  const stage = lead && stages ? resolveLeadStage(lead, stages) : undefined

  function closeAnd(action: () => void) {
    onOpenChange(false)
    action()
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full gap-0 overflow-y-auto p-0 sm:max-w-md">
        <SheetHeader className="border-b-[0.5px] border-neutral-200 p-4 pr-12 sm:p-6 sm:pr-14">
          <div className="flex items-center gap-2.5">
            <span
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full"
              style={{ backgroundColor: typeMeta.bg, color: typeMeta.text }}
            >
              <TypeIcon className="h-4 w-4" />
            </span>
            <SheetTitle className="text-base font-semibold text-neutral-900">{task.title}</SheetTitle>
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-2">
            <span
              className="rounded-full px-2 py-0.5 text-[11px] font-medium"
              style={{ backgroundColor: priorityMeta.bg, color: priorityMeta.text }}
            >
              {priorityMeta.label}
            </span>
            <span
              className="rounded-full px-2 py-0.5 text-[11px] font-medium"
              style={{ backgroundColor: statusMeta.bg, color: statusMeta.text }}
            >
              {statusMeta.label}
            </span>
            <span className="text-xs text-neutral-400">
              {formatDateBR(task.dueDate)} às {formatTime(task.dueDate)}
            </span>
          </div>
        </SheetHeader>

        <div className="flex-1 space-y-4 p-4 sm:p-6">
          {task.leadId && (
            <div className="rounded-[16px] border-[0.5px] border-neutral-200 bg-neutral-50 p-4">
              <p className="mb-3 text-xs font-medium uppercase tracking-wide text-neutral-400">Cliente</p>
              {lead ? (
                <div className="space-y-2.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <Link
                      href={`/leads/${lead.id}`}
                      className="text-sm font-semibold text-neutral-900 hover:text-brand"
                    >
                      {lead.name}
                    </Link>
                    {stage && (
                      <span
                        className="rounded-full px-2 py-0.5 text-[11px] font-medium"
                        style={stageBadgeStyle(stage)}
                      >
                        {stage.name}
                      </span>
                    )}
                  </div>

                  <PhoneRow phone={lead.phone} />
                  {lead.phone2 && <PhoneRow phone={lead.phone2} />}

                  {lead.email && (
                    <div className="flex items-center gap-2 text-sm text-neutral-400">
                      <Mail className="h-3.5 w-3.5 shrink-0" />
                      <span className="truncate">{lead.email}</span>
                    </div>
                  )}
                </div>
              ) : (
                <div className="h-16 animate-pulse rounded-[12px] bg-neutral-200" />
              )}
            </div>
          )}

          {task.description && (
            <div>
              <p className="mb-2 text-xs font-medium uppercase tracking-wide text-neutral-400">Descrição</p>
              <p className="text-sm text-neutral-600">{task.description}</p>
            </div>
          )}

          {task.status === 'pendente' && (
            <div className="space-y-2 pt-2">
              <button
                type="button"
                onClick={() => closeAnd(() => onComplete(task))}
                className="flex w-full items-center justify-center gap-2 rounded-[8px] bg-brand px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-brand-dark"
              >
                <CheckCircle className="h-4 w-4" />
                Concluir tarefa
              </button>
              <button
                type="button"
                onClick={() => closeAnd(() => onEdit(task))}
                className="flex w-full items-center justify-center gap-2 rounded-[8px] border-[1.5px] border-neutral-900 px-4 py-2.5 text-sm font-medium text-neutral-900 transition-colors hover:bg-neutral-100"
              >
                <Pencil className="h-4 w-4" />
                Editar tarefa
              </button>
              <button
                type="button"
                onClick={() => closeAnd(() => onCancel(task.id))}
                className="flex w-full items-center justify-center gap-2 rounded-[8px] px-4 py-2.5 text-sm font-medium text-danger transition-colors hover:bg-[#FFEBEE]"
              >
                <X className="h-4 w-4" />
                Cancelar tarefa
              </button>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}
