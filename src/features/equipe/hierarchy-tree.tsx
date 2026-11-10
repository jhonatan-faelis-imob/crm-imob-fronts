import { UsersRound } from 'lucide-react'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { getInitials } from '@/lib/utils'
import { ROLE_META } from './constants'
import type { Member, TeamWithMetrics } from './types'

export type HierarchyNode =
  | { kind: 'member'; key: string; member: Member; note?: string; children: HierarchyNode[] }
  | { kind: 'group'; key: string; title: string; subtitle: string; children: HierarchyNode[] }

const memberNode = (member: Member, children: HierarchyNode[] = [], note?: string): HierarchyNode => ({
  kind: 'member',
  key: `m-${member.id}`,
  member,
  note,
  children,
})

/**
 * Diretores > gerentes > equipes (pelo coordinatorId da equipe, não pelo cargo) > membros.
 * Quem está sem equipe fica num grupo próprio. Um nível vazio é pulado (sem diretor, gerentes viram a raiz)
 */
export function buildHierarchy(members: Member[], teams: TeamWithMetrics[]): HierarchyNode[] {
  const active = members.filter((member) => member.active)
  const byId = new Map(active.map((member) => [member.id, member]))
  const coordinatorIds = new Set(teams.map((team) => team.coordinatorId).filter(Boolean))

  const teamNodes: HierarchyNode[] = teams.map((team) => {
    const coordinator = team.coordinatorId ? byId.get(team.coordinatorId) : undefined
    const teamMembers = active
      .filter((member) => member.teamId === team.id && member.id !== team.coordinatorId)
      .map((member) => memberNode(member))
    if (coordinator) return memberNode(coordinator, teamMembers, `Coordena ${team.name}`)
    return { kind: 'group', key: `t-${team.id}`, title: team.name, subtitle: 'Sem coordenador', children: teamMembers }
  })

  // Diretores e gerentes já aparecem como coordenadores; não repetir no topo
  const leaders = (role: 'diretor' | 'gerente') =>
    active.filter((member) => member.role === role && !coordinatorIds.has(member.id))
  const withoutTeam = active.filter(
    (member) =>
      !member.teamId && !coordinatorIds.has(member.id) && member.role !== 'diretor' && member.role !== 'gerente',
  )
  const lower: HierarchyNode[] = [...teamNodes]
  if (withoutTeam.length > 0) {
    lower.push({
      kind: 'group',
      key: 'sem-equipe',
      title: 'Sem equipe',
      subtitle: `${withoutTeam.length} ${withoutTeam.length === 1 ? 'pessoa' : 'pessoas'}`,
      children: withoutTeam.map((member) => memberNode(member)),
    })
  }

  const gerentes = leaders('gerente')
  const middle = gerentes.length > 0 ? gerentes.map((gerente) => memberNode(gerente, lower)) : lower
  const diretores = leaders('diretor')
  return diretores.length > 0 ? diretores.map((diretor) => memberNode(diretor, middle)) : middle
}

function HierarchyNodeItem({ node }: { node: HierarchyNode }) {
  return (
    <li>
      {node.kind === 'member' ? (
        <div className="flex items-center gap-2 py-1">
          <Avatar size="sm">
            <AvatarFallback className="bg-brand-bg text-xs text-brand">{getInitials(node.member.name)}</AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-neutral-900">{node.member.name}</p>
            {node.note && <p className="truncate text-[11px] text-neutral-400">{node.note}</p>}
          </div>
          <span
            className="shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium"
            style={{ backgroundColor: ROLE_META[node.member.role].bg, color: ROLE_META[node.member.role].text }}
          >
            {ROLE_META[node.member.role].label}
          </span>
        </div>
      ) : (
        <div className="flex items-center gap-2 py-1">
          <div className="flex size-6 shrink-0 items-center justify-center rounded-full bg-neutral-100 text-neutral-400">
            <UsersRound className="h-3.5 w-3.5" />
          </div>
          <p className="min-w-0 flex-1 truncate text-sm font-medium text-neutral-900">{node.title}</p>
          <span className="shrink-0 text-[11px] text-neutral-400">{node.subtitle}</span>
        </div>
      )}

      {node.children.length > 0 && (
        <ul className="ml-3 space-y-0.5 border-l-[1.5px] border-neutral-200 pl-4">
          {node.children.map((child) => (
            <HierarchyNodeItem key={child.key} node={child} />
          ))}
        </ul>
      )}
    </li>
  )
}

export function HierarchyTree({ nodes }: { nodes: HierarchyNode[] }) {
  if (nodes.length === 0) {
    return <p className="text-sm text-neutral-400">Ninguém cadastrado ainda.</p>
  }

  return (
    <ul className="space-y-0.5">
      {nodes.map((node) => (
        <HierarchyNodeItem key={node.key} node={node} />
      ))}
    </ul>
  )
}
