import { TrendingUp, Users, UsersRound, Wallet, type LucideIcon } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import type { Member, TeamWithMetrics } from './types'

function computeOverview(members: Member[], teams: TeamWithMetrics[]) {
  const activeMembers = members.filter((member) => member.active).length
  const activeTeams = teams.filter((team) => team.active).length

  const activeBrokers = members.filter((member) => member.active && member.role === 'corretor')
  const avgLeadsPerBroker =
    activeBrokers.length > 0
      ? Math.round(activeBrokers.reduce((sum, member) => sum + member.metrics.leadsCount, 0) / activeBrokers.length)
      : 0

  const totalVgv = members
    .filter((member) => member.active)
    .reduce((sum, member) => sum + member.metrics.vgv, 0)

  return { activeMembers, activeTeams, avgLeadsPerBroker, totalVgv }
}

export function OverviewCards({ members, teams }: { members: Member[]; teams: TeamWithMetrics[] }) {
  const { activeMembers, activeTeams, avgLeadsPerBroker, totalVgv } = computeOverview(members, teams)

  const cards: { label: string; value: string; icon: LucideIcon }[] = [
    { label: 'Membros ativos', value: String(activeMembers), icon: Users },
    { label: 'Equipes ativas', value: String(activeTeams), icon: UsersRound },
    { label: 'Média de leads por corretor', value: String(avgLeadsPerBroker), icon: TrendingUp },
    { label: 'VGV total do mês', value: formatCurrency(totalVgv), icon: Wallet },
  ]

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map(({ label, value, icon: Icon }) => (
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
  )
}
