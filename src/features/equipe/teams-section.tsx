import type { Member, TeamWithMetrics } from './types'
import { TeamCard } from './team-card'

export function TeamsSection({ teams, members }: { teams: TeamWithMetrics[]; members: Member[] }) {
  const topTeamId = teams.reduce<{ id: string; vgv: number } | null>((top, team) => {
    if (!top || team.metrics.vgvRealized > top.vgv) return { id: team.id, vgv: team.metrics.vgvRealized }
    return top
  }, null)?.id

  return (
    <section>
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-[20px] font-semibold text-neutral-900">Equipes</h2>
        <button
          type="button"
          onClick={() => console.log('Ver todas as equipes')}
          className="text-sm font-medium text-brand hover:text-brand-dark"
        >
          Ver todas
        </button>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
        {teams.map((team) => {
          const teamMembers = members.filter((member) => member.teamId === team.id)
          const coordinator = members.find((member) => member.id === team.coordinatorId)
          const brokers = teamMembers.filter((member) => member.role === 'corretor')

          return (
            <TeamCard
              key={team.id}
              team={team}
              coordinator={coordinator}
              brokers={brokers}
              isTopRanked={team.id === topTeamId}
            />
          )
        })}
      </div>
    </section>
  )
}
