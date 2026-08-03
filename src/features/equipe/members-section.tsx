import { MemberCard } from './member-card'
import { MembersFiltersBar } from './members-filters-bar'
import type { Member, MemberFilters, TeamWithMetrics } from './types'

function matchesFilters(member: Member, filters: MemberFilters) {
  if (filters.status === 'ativos' && !member.active) return false
  if (filters.status === 'inativos' && member.active) return false
  if (filters.teamId !== 'todas' && member.teamId !== filters.teamId) return false
  if (filters.role !== 'todos' && member.role !== filters.role) return false

  const search = filters.search.trim().toLowerCase()
  if (search && !member.name.toLowerCase().includes(search)) return false

  return true
}

export function MembersSection({
  members,
  teams,
  filters,
  onFiltersChange,
}: {
  members: Member[]
  teams: TeamWithMetrics[]
  filters: MemberFilters
  onFiltersChange: (filters: MemberFilters) => void
}) {
  const filteredMembers = members.filter((member) => matchesFilters(member, filters))
  const teamNameById = new Map(teams.map((team) => [team.id, team.name]))

  return (
    <section className="space-y-4">
      <h2 className="text-[20px] font-semibold text-neutral-900">Membros</h2>

      <MembersFiltersBar filters={filters} teams={teams} onChange={onFiltersChange} />

      {filteredMembers.length === 0 ? (
        <p className="rounded-[16px] border-[0.5px] border-dashed border-neutral-200 p-8 text-center text-sm text-neutral-400">
          Nenhum membro encontrado com os filtros atuais.
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredMembers.map((member) => (
            <MemberCard
              key={member.id}
              member={member}
              teamName={member.teamId ? teamNameById.get(member.teamId) : undefined}
            />
          ))}
        </div>
      )}
    </section>
  )
}
