import { Crown, MoreVertical, Users, UsersRound } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarGroup, AvatarGroupCount } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { formatCurrency, getInitials } from '@/lib/utils'
import type { Member, TeamWithMetrics } from './types'

const MAX_VISIBLE_AVATARS = 4

export function TeamCard({
  team,
  coordinator,
  brokers,
  isTopRanked,
  canManageMembers,
  canChangeCoordinator,
  onManage,
}: {
  team: TeamWithMetrics
  coordinator: Member | undefined
  brokers: Member[]
  isTopRanked: boolean
  canManageMembers: boolean
  canChangeCoordinator: boolean
  onManage: () => void
}) {
  const activeBrokersCount = brokers.filter((member) => member.active).length
  const progressPct =
    team.metrics.vgvTarget > 0 ? Math.round((team.metrics.vgvRealized / team.metrics.vgvTarget) * 100) : 0
  const visibleBrokers = brokers.slice(0, MAX_VISIBLE_AVATARS)
  const hiddenBrokersCount = brokers.length - visibleBrokers.length

  return (
    <div className="group relative flex flex-col gap-4 rounded-[16px] border-[0.5px] border-neutral-200 bg-white p-5 transition-colors hover:border-brand">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <h3 className="text-base font-semibold text-neutral-900">{team.name}</h3>
          {isTopRanked && (
            <span className="rounded-full bg-[#FFF7E0] px-2.5 py-1 text-xs font-medium text-[#B45309]">
              🥇 1º lugar
            </span>
          )}
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <button
                type="button"
                aria-label="Mais opções"
                className="shrink-0 rounded-[8px] p-1.5 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-900"
              />
            }
          >
            <MoreVertical className="h-4 w-4" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={onManage}>Ver detalhes</DropdownMenuItem>
            {canManageMembers && <DropdownMenuItem onClick={onManage}>Gerenciar membros</DropdownMenuItem>}
            {canChangeCoordinator && (
              <DropdownMenuItem onClick={onManage}>
                {coordinator ? 'Trocar coordenador' : 'Definir coordenador'}
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {coordinator ? (
        <div className="flex items-center gap-2.5">
          <Avatar>
            <AvatarFallback className="bg-brand-bg text-brand">{getInitials(coordinator.name)}</AvatarFallback>
          </Avatar>
          <p className="min-w-0 truncate text-sm text-neutral-600">
            Coord: <span className="font-medium text-neutral-900">{coordinator.name}</span>
          </p>
        </div>
      ) : (
        <div className="flex items-center gap-2.5">
          <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-neutral-100 text-neutral-400">
            <Crown className="h-4 w-4" />
          </div>
          <p className="min-w-0 flex-1 truncate text-sm text-neutral-400">Sem coordenador</p>
          {canChangeCoordinator && (
            <button type="button" onClick={onManage} className="shrink-0 text-sm font-medium text-brand hover:text-brand-dark">
              Definir coordenador
            </button>
          )}
        </div>
      )}

      <div className="flex items-center gap-1.5 text-sm text-neutral-400">
        <Users className="h-3.5 w-3.5" />
        {activeBrokersCount} corretor{activeBrokersCount === 1 ? '' : 'es'}
      </div>

      <div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-neutral-100">
          <div
            className="h-full rounded-full bg-brand"
            style={{ width: `${Math.min(100, progressPct)}%` }}
          />
        </div>
        <p className="mt-1.5 text-xs text-neutral-400">
          {formatCurrency(team.metrics.vgvRealized)} de {formatCurrency(team.metrics.vgvTarget)} ({progressPct}%)
        </p>
      </div>

      {brokers.length > 0 && (
        <AvatarGroup>
          {visibleBrokers.map((member) => (
            <Avatar key={member.id} className="ring-2 ring-white">
              <AvatarFallback className="bg-brand-bg text-brand">{getInitials(member.name)}</AvatarFallback>
            </Avatar>
          ))}
          {hiddenBrokersCount > 0 && (
            <AvatarGroupCount>+{hiddenBrokersCount}</AvatarGroupCount>
          )}
        </AvatarGroup>
      )}

      {canManageMembers && (
        <button
          type="button"
          onClick={onManage}
          className="mt-auto inline-flex min-h-11 items-center justify-center gap-2 rounded-[8px] border-[0.5px] border-neutral-200 px-4 py-2 text-sm font-medium text-neutral-600 transition-colors hover:border-brand hover:text-brand"
        >
          <UsersRound className="h-4 w-4" />
          Gerenciar membros
        </button>
      )}
    </div>
  )
}
