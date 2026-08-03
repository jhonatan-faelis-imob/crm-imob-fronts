import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { getInitials } from '@/lib/utils'
import { ROLE_META } from './constants'
import type { Member } from './types'

export interface HierarchyNode {
  member: Member
  children: HierarchyNode[]
}

export function buildHierarchy(members: Member[]): HierarchyNode[] {
  const gerentes = members.filter((member) => member.role === 'gerente')
  const coordenadoresAndAdmin = members.filter(
    (member) => member.role === 'coordenador' || member.role === 'administrativo'
  )
  const corretores = members.filter((member) => member.role === 'corretor')

  function buildCoordNode(member: Member): HierarchyNode {
    const children =
      member.role === 'coordenador'
        ? corretores
            .filter((corretor) => corretor.teamId === member.teamId)
            .map((corretor) => ({ member: corretor, children: [] }))
        : []
    return { member, children }
  }

  function buildGerenteNode(member: Member): HierarchyNode {
    return { member, children: coordenadoresAndAdmin.map(buildCoordNode) }
  }

  return members
    .filter((member) => member.role === 'diretor')
    .map((diretor) => ({ member: diretor, children: gerentes.map(buildGerenteNode) }))
}

function HierarchyNodeItem({ node }: { node: HierarchyNode }) {
  const roleMeta = ROLE_META[node.member.role]

  return (
    <li>
      <div className="flex items-center gap-2 py-1">
        <Avatar size="sm">
          <AvatarFallback className="bg-brand-bg text-xs text-brand">{getInitials(node.member.name)}</AvatarFallback>
        </Avatar>
        <p className="min-w-0 flex-1 truncate text-sm font-medium text-neutral-900">{node.member.name}</p>
        <span
          className="shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium"
          style={{ backgroundColor: roleMeta.bg, color: roleMeta.text }}
        >
          {roleMeta.label}
        </span>
      </div>

      {node.children.length > 0 && (
        <ul className="ml-3 space-y-0.5 border-l-[1.5px] border-neutral-200 pl-4">
          {node.children.map((child) => (
            <HierarchyNodeItem key={child.member.id} node={child} />
          ))}
        </ul>
      )}
    </li>
  )
}

export function HierarchyTree({ nodes }: { nodes: HierarchyNode[] }) {
  if (nodes.length === 0) {
    return <p className="text-sm text-neutral-400">Nenhum diretor cadastrado ainda.</p>
  }

  return (
    <ul className="space-y-0.5">
      {nodes.map((node) => (
        <HierarchyNodeItem key={node.member.id} node={node} />
      ))}
    </ul>
  )
}
