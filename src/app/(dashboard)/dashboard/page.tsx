'use client'

import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import {
  Bell,
  Plus,
  Users,
  CheckSquare,
  TrendingUp,
  Wallet,
  Phone,
  MessageCircle,
  Mail,
  Home,
  MoreHorizontal,
  Trophy,
  ArrowRight,
  Building2,
  type LucideIcon,
} from 'lucide-react'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Skeleton } from '@/components/ui/skeleton'
import { formatCurrency, getInitials } from '@/lib/utils'
import type { TaskType } from '@/types'
import { reportsService } from '@/services/reports.service'
import { tasksService } from '@/services/tasks.service'
import { funnelStagesService } from '@/services/funnel-stages.service'
import { propertiesService } from '@/services/properties.service'

interface DashboardData {
  totalLeads: number
  leadsWithoutContact: number
  overdueTasks: number
  pendingTasks: number
  monthlyVgv: number | string
  monthlySalesCount: number
  funnelCounts: { funnelStageId: string | null; _count: { id: number } }[]
}

interface TaskSummary {
  overdue: number
  dueToday: number
  pending: number
}

interface FunnelStageApi {
  id: string
  name: string
  color: string
  orderIndex: number
}

interface TaskListItem {
  id: string
  type: TaskType
  title: string
  dueDate: string
  lead: { id: string; name: string } | null
}

interface BrokerRankingEntry {
  position: number
  broker: { id: string; name: string; avatarUrl: string | null } | null
  vgv: number | string
  units: number
}

interface SalesByPropertyEntry {
  propertyId: string | null
  _sum: { saleValue: number | string | null }
  _count: { id: number }
}

interface PropertyListItem {
  id: string
  title: string
}

const TASK_TYPE_ICON: Record<TaskType, LucideIcon> = {
  ligacao: Phone,
  whatsapp: MessageCircle,
  email: Mail,
  visita: Home,
  reuniao: Users,
  outro: MoreHorizontal,
}

function formatHeaderDate(date: Date) {
  const formatted = new Intl.DateTimeFormat('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(date)
  return formatted.charAt(0).toUpperCase() + formatted.slice(1)
}

function formatTaskDateTime(dateIso: string) {
  const date = new Date(dateIso)
  const day = String(date.getDate()).padStart(2, '0')
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  return `${day}/${month} · ${hours}:${minutes}`
}

function getTaskBadge(dueAtIso: string): { label: string; className: string } | null {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const due = new Date(dueAtIso)
  due.setHours(0, 0, 0, 0)

  if (due < today) return { label: 'Vencida', className: 'bg-danger-bg text-danger' }
  if (due.getTime() === today.getTime()) return { label: 'Hoje', className: 'bg-warning-bg text-warning' }
  return null
}

function monthRange() {
  const now = new Date()
  const start = new Date(now.getFullYear(), now.getMonth(), 1)
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0)
  return { startDate: start.toISOString().slice(0, 10), endDate: end.toISOString().slice(0, 10) }
}

function RankingCard({
  title,
  entries,
  formatValue,
  monthLabel,
  isLoading,
}: {
  title: string
  entries: BrokerRankingEntry[]
  formatValue: (value: number) => string
  monthLabel: string
  isLoading: boolean
}) {
  return (
    <div className="rounded-[16px] border-[0.5px] border-neutral-200 bg-white p-5 lg:p-6">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-[20px] font-semibold text-neutral-900">{title}</h2>
        <span className="shrink-0 rounded-full bg-neutral-100 px-3 py-1 text-xs font-medium text-neutral-600">
          {monthLabel}
        </span>
      </div>
      {isLoading ? (
        <div className="mt-4 space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-9 w-full" />
          ))}
        </div>
      ) : entries.length === 0 ? (
        <p className="mt-4 text-sm text-neutral-400">Nenhuma venda no período.</p>
      ) : (
        <ul className="mt-4 space-y-3">
          {entries.map((entry) => (
            <li key={entry.broker?.id ?? entry.position} className="flex items-center gap-3">
              <span className="w-5 shrink-0 text-sm font-medium text-neutral-400">
                {entry.position}º
              </span>
              <Avatar>
                <AvatarFallback className="bg-brand-bg text-brand">
                  {getInitials(entry.broker?.name ?? '?')}
                </AvatarFallback>
              </Avatar>
              <span className="min-w-0 flex-1 truncate text-sm font-medium text-neutral-900">
                {entry.broker?.name ?? 'Corretor removido'}
              </span>
              {entry.position === 1 && <Trophy className="h-4 w-4 shrink-0 text-amber-500" />}
              <span className="shrink-0 text-sm font-semibold text-neutral-900">
                {formatValue(Number(entry.vgv))}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export default function DashboardPage() {
  const { startDate, endDate } = monthRange()
  const currentMonthLabel = new Intl.DateTimeFormat('pt-BR', { month: 'long' }).format(new Date())

  const { data: dashboard, isLoading: isDashboardLoading } = useQuery<DashboardData>({
    queryKey: ['dashboard'],
    queryFn: reportsService.getDashboard,
  })

  const { data: taskSummary } = useQuery<TaskSummary>({
    queryKey: ['tasks-summary'],
    queryFn: tasksService.getSummary,
  })

  const { data: stages } = useQuery<FunnelStageApi[]>({
    queryKey: ['funnel-stages'],
    queryFn: funnelStagesService.findAll,
  })

  const { data: openTasks, isLoading: isTasksLoading } = useQuery<{ data: TaskListItem[] }>({
    queryKey: ['tasks', { period: 'week', status: 'pendente', limit: '5' }],
    queryFn: () => tasksService.findAll({ period: 'week', status: 'pendente', limit: '5' }),
  })

  const { data: ranking, isLoading: isRankingLoading } = useQuery<BrokerRankingEntry[]>({
    queryKey: ['broker-ranking', startDate, endDate],
    queryFn: () => reportsService.getBrokerRanking(startDate, endDate),
  })

  const { data: salesByProperty, isLoading: isSalesByPropertyLoading } = useQuery<SalesByPropertyEntry[]>({
    queryKey: ['sales-by-property', startDate, endDate],
    queryFn: () => reportsService.getSalesByProperty(startDate, endDate),
  })

  const { data: properties } = useQuery<{ data: PropertyListItem[] }>({
    queryKey: ['properties', { limit: '100' }],
    queryFn: () => propertiesService.findAll({ limit: '100' }),
  })

  const alerts = [
    dashboard && dashboard.leadsWithoutContact > 0
      ? `${dashboard.leadsWithoutContact} lead${dashboard.leadsWithoutContact > 1 ? 's' : ''} sem contato há mais de 3 dias`
      : null,
    dashboard && dashboard.overdueTasks > 0
      ? `${dashboard.overdueTasks} tarefa${dashboard.overdueTasks > 1 ? 's' : ''} vencida${dashboard.overdueTasks > 1 ? 's' : ''}`
      : null,
    taskSummary && taskSummary.overdue > 0
      ? `Você tem ${taskSummary.overdue} tarefa${taskSummary.overdue > 1 ? 's' : ''} pessoal${taskSummary.overdue > 1 ? 'is' : ''} vencida${taskSummary.overdue > 1 ? 's' : ''}`
      : null,
  ].filter((alert): alert is string => alert !== null)

  const metrics: { label: string; value: string; icon: LucideIcon }[] = [
    { label: 'Leads ativos', value: String(dashboard?.totalLeads ?? 0), icon: Users },
    { label: 'Tarefas pendentes', value: String(dashboard?.pendingTasks ?? 0), icon: CheckSquare },
    { label: 'Vendas no mês', value: String(dashboard?.monthlySalesCount ?? 0), icon: TrendingUp },
    { label: 'VGV do mês', value: formatCurrency(Number(dashboard?.monthlyVgv ?? 0)), icon: Wallet },
  ]

  const funnelByStage = (stages ?? [])
    .slice()
    .sort((a, b) => a.orderIndex - b.orderIndex)
    .map((stage) => ({
      stage,
      count: dashboard?.funnelCounts.find((f) => f.funnelStageId === stage.id)?._count.id ?? 0,
    }))
  const maxFunnelCount = Math.max(1, ...funnelByStage.map((f) => f.count))

  const rankingByVgv = (ranking ?? [])
    .slice()
    .sort((a, b) => Number(b.vgv) - Number(a.vgv))
    .map((entry, index) => ({ ...entry, position: index + 1 }))
  const rankingByUnits = (ranking ?? [])
    .slice()
    .sort((a, b) => b.units - a.units)
    .map((entry, index) => ({ ...entry, position: index + 1 }))

  const propertySales = (salesByProperty ?? []).map((entry) => ({
    id: entry.propertyId ?? 'sem-imovel',
    name: properties?.data.find((p) => p.id === entry.propertyId)?.title ?? 'Sem empreendimento vinculado',
    units: entry._count.id,
    vgv: Number(entry._sum.saleValue ?? 0),
  }))

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-[28px] font-semibold text-neutral-900">Dashboard</h1>
          <p className="mt-1 text-sm text-neutral-400">{formatHeaderDate(new Date())}</p>
        </div>
        <Link
          href="/leads"
          className="inline-flex items-center justify-center gap-2 rounded-[8px] bg-brand px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-brand-dark"
        >
          <Plus className="h-4 w-4" />
          Novo lead
        </Link>
      </div>

      {alerts.length > 0 && (
        <div className="rounded-[16px] border-[0.5px] border-[#FECDD3] bg-brand-bg p-5">
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-brand" />
            <h2 className="text-base font-semibold text-brand">Alertas</h2>
          </div>
          <ul className="mt-3 space-y-2">
            {alerts.map((alert) => (
              <li key={alert} className="flex items-start gap-2 text-sm text-neutral-900">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand" />
                {alert}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {isDashboardLoading
          ? Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-[92px] rounded-[16px]" />
            ))
          : metrics.map(({ label, value, icon: Icon }) => (
              <div key={label} className="rounded-[16px] border-[0.5px] border-neutral-200 bg-white p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-[28px] font-semibold text-neutral-900">{value}</p>
                    <p className="mt-1 text-[13px] text-neutral-400">{label}</p>
                  </div>
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-bg text-brand">
                    <Icon className="h-[18px] w-[18px]" />
                  </div>
                </div>
              </div>
            ))}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="rounded-[16px] border-[0.5px] border-neutral-200 bg-white p-5 lg:p-6">
          <h2 className="text-[20px] font-semibold text-neutral-900">Funil de vendas</h2>

          <div className="mt-5 space-y-3">
            {!stages ? (
              Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-8 w-full" />)
            ) : funnelByStage.length === 0 ? (
              <p className="text-sm text-neutral-400">Nenhuma etapa de funil cadastrada.</p>
            ) : (
              funnelByStage.map(({ stage, count }) => {
                const pct = Math.round((count / maxFunnelCount) * 100)
                return (
                  <div key={stage.id}>
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium text-neutral-900">{stage.name}</span>
                      <span className="text-neutral-400">
                        {count} · {pct}%
                      </span>
                    </div>
                    <div className="mt-1.5 h-2 w-full rounded-full bg-neutral-100">
                      <div
                        className="h-2 rounded-full"
                        style={{ width: `${pct}%`, backgroundColor: stage.color }}
                      />
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>

        <div className="rounded-[16px] border-[0.5px] border-neutral-200 bg-white p-5 lg:p-6">
          <h2 className="text-[20px] font-semibold text-neutral-900">Tarefas em aberto</h2>
          {isTasksLoading ? (
            <div className="mt-4 space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-11 w-full" />
              ))}
            </div>
          ) : (
            <ul className="mt-4 space-y-3">
              {(openTasks?.data ?? []).map((task) => {
                const Icon = TASK_TYPE_ICON[task.type]
                const badge = getTaskBadge(task.dueDate)
                return (
                  <li key={task.id} className="flex items-start gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-neutral-100 text-neutral-600">
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="truncate text-sm font-medium text-neutral-900">{task.title}</p>
                        {badge && (
                          <span
                            className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium ${badge.className}`}
                          >
                            {badge.label}
                          </span>
                        )}
                      </div>
                      <p className="mt-0.5 truncate text-xs text-neutral-400">
                        {task.lead?.name ?? 'Sem lead vinculado'} · {formatTaskDateTime(task.dueDate)}
                      </p>
                    </div>
                  </li>
                )
              })}
              {(openTasks?.data ?? []).length === 0 && (
                <p className="text-sm text-neutral-400">Nenhuma tarefa em aberto.</p>
              )}
            </ul>
          )}
          <Link
            href="/tarefas"
            className="mt-4 flex items-center gap-1 text-sm font-medium text-brand hover:text-brand-dark"
          >
            Ver todas
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <RankingCard
          title="Ranking — quantidade de vendas"
          entries={rankingByUnits}
          formatValue={(value) => String(value)}
          monthLabel={currentMonthLabel}
          isLoading={isRankingLoading}
        />
        <RankingCard
          title="Ranking — VGV"
          entries={rankingByVgv}
          formatValue={formatCurrency}
          monthLabel={currentMonthLabel}
          isLoading={isRankingLoading}
        />
      </div>

      <section>
        <h2 className="text-[20px] font-semibold text-neutral-900">Vendas por empreendimento</h2>
        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
          {isSalesByPropertyLoading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-[92px] rounded-[16px]" />
            ))
          ) : propertySales.length === 0 ? (
            <p className="text-sm text-neutral-400">Nenhuma venda registrada no período.</p>
          ) : (
            propertySales.map((property) => (
              <div
                key={property.id}
                className="rounded-[16px] border-[0.5px] border-neutral-200 bg-white p-5"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-bg text-brand">
                    <Building2 className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-neutral-900">{property.name}</p>
                    <p className="text-xs text-neutral-400">
                      {property.units} unidade{property.units !== 1 ? 's' : ''} · {formatCurrency(property.vgv)}
                    </p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  )
}
