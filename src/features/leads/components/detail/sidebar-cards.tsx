import { ArrowRight, Calendar, Mail, MessageCircle, Sparkles } from 'lucide-react'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { formatCurrency, getInitials } from '@/lib/utils'
import type { Lead, Task, TaskType } from '@/types'
import { SOURCE_META } from '../../constants'
import { formatDateBR, formatDateTimeBR } from './format'

const PROFILE_LABEL: Record<Lead['profile'], string> = {
  interessado: 'Interessado',
  proprietario: 'Proprietário',
}

const TASK_TYPE_LABEL: Record<TaskType, string> = {
  ligacao: 'Ligação',
  whatsapp: 'WhatsApp',
  email: 'E-mail',
  visita: 'Visita',
  reuniao: 'Reunião',
  outro: 'Outro',
}

function scoreColor(score: number) {
  if (score > 70) return '#008A05'
  if (score >= 40) return '#C45800'
  return '#D93B30'
}

function ScoreRing({ score }: { score: number }) {
  const radius = 26
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (Math.min(100, Math.max(0, score)) / 100) * circumference
  const color = scoreColor(score)

  return (
    <div className="relative flex h-16 w-16 shrink-0 items-center justify-center">
      <svg viewBox="0 0 64 64" className="h-16 w-16 -rotate-90">
        <circle cx="32" cy="32" r={radius} fill="none" stroke="#F7F7F7" strokeWidth="6" />
        <circle
          cx="32"
          cy="32"
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
        />
      </svg>
      <span className="absolute text-sm font-semibold text-neutral-900">{score}</span>
    </div>
  )
}

export function SummaryCard({ lead, onAnalyze }: { lead: Lead; onAnalyze: () => void }) {
  const source = SOURCE_META[lead.source]
  const SourceIcon = source.icon
  const whatsappHref = `https://wa.me/55${lead.phone.replace(/\D/g, '')}`

  return (
    <div className="rounded-[16px] border-[0.5px] border-neutral-200 bg-white p-5">
      <div className="flex items-center gap-3">
        <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-brand-bg text-xl font-semibold text-brand">
          {getInitials(lead.name)}
        </div>
        <div className="min-w-0">
          <p className="truncate text-base font-semibold text-neutral-900">{lead.name}</p>
          <p className="text-sm text-neutral-400">{PROFILE_LABEL[lead.profile]}</p>
        </div>
      </div>

      <div className="mt-4 flex items-center gap-3 rounded-[12px] bg-neutral-100 p-3">
        {lead.aiScore !== undefined ? (
          <ScoreRing score={lead.aiScore} />
        ) : (
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-white text-center text-[11px] text-neutral-400">
            Sem score
          </div>
        )}
        <div className="min-w-0 flex-1">
          <p className="text-xs text-neutral-400">Score de IA</p>
          <button
            type="button"
            onClick={onAnalyze}
            className="mt-1 inline-flex items-center gap-1.5 rounded-[8px] bg-brand px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-brand-dark"
          >
            <Sparkles className="h-3.5 w-3.5" />
            Analisar com IA
          </button>
        </div>
      </div>

      <div className="mt-4 space-y-2.5 text-sm">
        <div className="flex items-center justify-between gap-2">
          <span className="text-neutral-600">{lead.phone}</span>
          <a
            href={whatsappHref}
            target="_blank"
            rel="noreferrer"
            aria-label="Conversar no WhatsApp"
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#E8F5E9] text-success transition-colors hover:bg-[#d3ecd5]"
          >
            <MessageCircle className="h-4 w-4" />
          </a>
        </div>
        {lead.email && (
          <div className="flex items-center gap-2 text-neutral-600">
            <Mail className="h-4 w-4 shrink-0 text-neutral-400" />
            <span className="truncate">{lead.email}</span>
          </div>
        )}
        <div className="flex items-center gap-2 text-neutral-600">
          <SourceIcon className="h-4 w-4 shrink-0 text-neutral-400" />
          {source.label}
        </div>
        <div className="flex items-center gap-2 text-neutral-600">
          <Calendar className="h-4 w-4 shrink-0 text-neutral-400" />
          Cadastrado em {formatDateBR(lead.createdAt)}
        </div>
      </div>

      {lead.tags && lead.tags.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-1.5 border-t-[0.5px] border-neutral-200 pt-4">
          {lead.tags.map((tag) => (
            <span
              key={tag.id}
              className="rounded-full bg-neutral-100 px-2.5 py-1 text-xs font-medium text-neutral-600"
            >
              {tag.label}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}

function FinancialRow({ label, value, strong }: { label: string; value: number | undefined; strong?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-neutral-400">{label}</span>
      <span className={strong ? 'font-semibold text-neutral-900' : 'text-neutral-900'}>
        {value !== undefined ? formatCurrency(value) : '—'}
      </span>
    </div>
  )
}

export function FinancialCard({
  lead,
  matchCount,
  onViewLinkedProperties,
}: {
  lead: Lead
  matchCount: number
  onViewLinkedProperties: () => void
}) {
  return (
    <div className="rounded-[16px] border-[0.5px] border-neutral-200 bg-white p-5">
      <h3 className="text-sm font-semibold text-neutral-900">Financeiro</h3>
      <div className="mt-3 space-y-2.5 text-sm">
        <FinancialRow label="Renda" value={lead.income} />
        <FinancialRow label="FGTS" value={lead.fgtsValue} />
        <FinancialRow label="Recursos próprios" value={lead.ownResources} />
        <FinancialRow label="Valor de interesse" value={lead.interestValue} strong />
      </div>
      {lead.income !== undefined && (
        <button
          type="button"
          onClick={onViewLinkedProperties}
          className="mt-4 flex items-center gap-1 text-sm font-medium text-brand hover:text-brand-dark"
        >
          Enquadra em {matchCount} empreendimento{matchCount === 1 ? '' : 's'}
          <ArrowRight className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  )
}

export function ResponsibleCard({ lead, onTransfer }: { lead: Lead; onTransfer: () => void }) {
  return (
    <div className="rounded-[16px] border-[0.5px] border-neutral-200 bg-white p-5">
      <h3 className="text-sm font-semibold text-neutral-900">Responsável</h3>
      <div className="mt-3 flex items-center gap-3">
        <Avatar>
          <AvatarFallback className="bg-brand-bg text-brand">{getInitials(lead.ownerName)}</AvatarFallback>
        </Avatar>
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-neutral-900">{lead.ownerName}</p>
          <p className="text-xs text-neutral-400">{lead.teamId ? 'Equipe atribuída' : 'Sem equipe atribuída'}</p>
        </div>
      </div>
      <button
        type="button"
        onClick={onTransfer}
        className="mt-4 w-full rounded-[8px] border-[1.5px] border-neutral-200 px-4 py-2 text-sm font-medium text-neutral-600 transition-colors hover:border-brand hover:text-brand"
      >
        Transferir
      </button>
    </div>
  )
}

export function NextTaskCard({
  tasks,
  onComplete,
  onScheduleNew,
  onOpenDetail,
}: {
  tasks: Task[]
  onComplete: (task: Task) => void
  onScheduleNew: () => void
  onOpenDetail: (task: Task) => void
}) {
  const nextTask = [...tasks]
    .filter((task) => task.status === 'pendente')
    .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())[0]

  return (
    <div className="rounded-[16px] border-[0.5px] border-neutral-200 bg-white p-5">
      <h3 className="text-sm font-semibold text-neutral-900">Próxima tarefa</h3>
      {nextTask ? (
        <div
          role="button"
          tabIndex={0}
          onClick={() => onOpenDetail(nextTask)}
          onKeyDown={(event) => {
            if (event.key === 'Enter' || event.key === ' ') onOpenDetail(nextTask)
          }}
          className="mt-3 cursor-pointer rounded-[12px]"
        >
          <p className="text-xs font-medium text-brand">{TASK_TYPE_LABEL[nextTask.type]}</p>
          <p className="mt-1 text-sm font-medium text-neutral-900">{nextTask.title}</p>
          <p className="mt-1 text-xs text-neutral-400">{formatDateTimeBR(nextTask.dueDate)}</p>
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation()
              onComplete(nextTask)
            }}
            className="mt-3 w-full rounded-[8px] bg-brand px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-dark"
          >
            Concluir
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={onScheduleNew}
          className="mt-3 w-full rounded-[8px] bg-brand px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-brand-dark"
        >
          Agendar tarefa
        </button>
      )}
    </div>
  )
}
