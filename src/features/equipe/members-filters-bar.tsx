import { Search } from 'lucide-react'
import type { Role } from '@/types'
import { ROLE_META, ROLES } from './constants'
import type { MemberFilters, RoleFilter } from './types'
import type { TeamWithMetrics } from './types'

const selectClassName =
  'rounded-[8px] border-[1.5px] border-line bg-paper px-3 py-2 text-sm text-brand outline-none focus:border-brand'

export function MembersFiltersBar({
  filters,
  teams,
  onChange,
}: {
  filters: MemberFilters
  teams: TeamWithMetrics[]
  onChange: (filters: MemberFilters) => void
}) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
      <div className="relative flex-1 sm:min-w-[220px]">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          type="text"
          value={filters.search}
          onChange={(event) => onChange({ ...filters, search: event.target.value })}
          placeholder="Buscar por nome"
          className="w-full rounded-[8px] border-[1.5px] border-line bg-paper py-2 pl-9 pr-3 text-sm text-brand outline-none placeholder:text-muted-foreground focus:border-brand"
        />
      </div>

      <select
        value={filters.teamId}
        onChange={(event) => onChange({ ...filters, teamId: event.target.value })}
        className={selectClassName}
      >
        <option value="todas">Todas as equipes</option>
        {teams.map((team) => (
          <option key={team.id} value={team.id}>
            {team.name}
          </option>
        ))}
      </select>

      <select
        value={filters.role}
        onChange={(event) => onChange({ ...filters, role: event.target.value as RoleFilter })}
        className={selectClassName}
      >
        <option value="todos">Todos os cargos</option>
        {ROLES.map((role: Role) => (
          <option key={role} value={role}>
            {ROLE_META[role].label}
          </option>
        ))}
      </select>
    </div>
  )
}
