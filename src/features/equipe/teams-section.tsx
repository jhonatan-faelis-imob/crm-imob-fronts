import { UsersRound } from 'lucide-react'
import { EmptyState } from '@/components/ui/empty-state'
import type { Member, TeamWithMetrics } from './types'
import { TeamCard } from './team-card'

export function TeamsSection({
  teams,
  members,
  canCreateTeam,
  canChangeCoordinator,
  canManageMembers,
  onCreateTeam,
  onManageTeam,
}: {
  teams: TeamWithMetrics[]
  members: Member[]
  canCreateTeam: boolean
  canChangeCoordinator: boolean
  canManageMembers: (teamId: string) => boolean
  onCreateTeam: () => void
  onManageTeam: (team: TeamWithMetrics) => void
}) {
  const topTeamId = teams.reduce<{ id: string; vgv: number } | null>((top, team) => {
    if (!top || team.metrics.vgvRealized > top.vgv) return { id: team.id, vgv: team.metrics.vgvRealized }
    return top
  }, null)?.id

  return (
    <section>
      <h2 className="text-[20px] font-semibold text-neutral-900">Equipes</h2>

      {teams.length === 0 ? (
        <div className="mt-4">
          <EmptyState
            icon={<UsersRound className="h-6 w-6" />}
            title="Nenhuma equipe ainda"
            description={
              canCreateTeam
                ? 'Comece criando sua primeira equipe. Você pode definir o coordenador depois.'
                : 'Ainda não há equipes. Peça a um gerente ou diretor para criar a primeira.'
            }
            action={canCreateTeam ? { label: 'Criar equipe', onClick: onCreateTeam } : undefined}
          />
        </div>
      ) : (
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
                isTopRanked={teams.length > 1 && team.id === topTeamId && team.metrics.vgvRealized > 0}
                canManageMembers={canManageMembers(team.id)}
                canChangeCoordinator={canChangeCoordinator}
                onManage={() => onManageTeam(team)}
              />
            )
          })}
        </div>
      )}
    </section>
  )
}
