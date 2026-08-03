import { Mail, MessageCircle, MoreVertical } from 'lucide-react'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { formatCurrency, getInitials } from '@/lib/utils'
import { ROLE_META } from './constants'
import type { Member } from './types'

export function MemberCard({ member, teamName }: { member: Member; teamName: string | undefined }) {
  const roleMeta = ROLE_META[member.role]
  const goalPct =
    member.metrics.goalTarget > 0 ? Math.round((member.metrics.vgv / member.metrics.goalTarget) * 100) : 0
  const whatsappHref = member.phone ? `https://wa.me/55${member.phone.replace(/\D/g, '')}` : undefined

  return (
    <div
      className={`flex flex-col gap-4 rounded-[16px] border-[0.5px] border-neutral-200 bg-white p-5 transition-colors hover:border-brand ${
        member.active ? '' : 'opacity-60'
      }`}
    >
      <div className="flex items-start gap-3">
        <Avatar className="size-16">
          <AvatarFallback className="bg-brand-bg text-lg text-brand">{getInitials(member.name)}</AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[15px] font-semibold text-neutral-900">{member.name}</p>
          <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
            <span
              className="rounded-full px-2 py-0.5 text-[11px] font-medium"
              style={{ backgroundColor: roleMeta.bg, color: roleMeta.text }}
            >
              {roleMeta.label}
            </span>
            {!member.active && (
              <span className="rounded-full bg-[#FFEBEE] px-2 py-0.5 text-[11px] font-medium text-danger">
                Inativo
              </span>
            )}
          </div>
          {member.creci && <p className="mt-1 text-xs text-neutral-400">{member.creci}</p>}
          <p className="text-xs text-neutral-400">{teamName ?? 'Sem equipe'}</p>
        </div>
      </div>

      <div className="border-t-[0.5px] border-neutral-200 pt-4">
        <div className="grid grid-cols-3 gap-2 text-center">
          <div>
            <p className="text-sm font-semibold text-neutral-900">{member.metrics.leadsCount}</p>
            <p className="text-[11px] text-neutral-400">Leads</p>
          </div>
          <div>
            <p className="text-sm font-semibold text-neutral-900">{member.metrics.salesCount}</p>
            <p className="text-[11px] text-neutral-400">Vendas</p>
          </div>
          <div>
            <p className="truncate text-sm font-semibold text-neutral-900">
              {formatCurrency(member.metrics.vgv)}
            </p>
            <p className="text-[11px] text-neutral-400">VGV</p>
          </div>
        </div>

        <div className="mt-3">
          <div className="h-2 w-full overflow-hidden rounded-full bg-neutral-100">
            <div className="h-full rounded-full bg-brand" style={{ width: `${Math.min(100, goalPct)}%` }} />
          </div>
          <p className="mt-1.5 text-xs text-neutral-400">{goalPct}% da meta individual</p>
        </div>
      </div>

      <div className="flex items-center justify-between gap-2 border-t-[0.5px] border-neutral-200 pt-3">
        <div className="flex items-center gap-1.5">
          <a
            href={whatsappHref}
            target="_blank"
            rel="noreferrer"
            aria-label="Conversar no WhatsApp"
            className={`flex h-8 w-8 items-center justify-center rounded-full bg-[#E8F5E9] text-success transition-colors hover:bg-[#d3ecd5] ${
              whatsappHref ? '' : 'pointer-events-none opacity-40'
            }`}
          >
            <MessageCircle className="h-4 w-4" />
          </a>
          <a
            href={`mailto:${member.email}`}
            aria-label="Enviar email"
            className="flex h-8 w-8 items-center justify-center rounded-full bg-[#EBF5FF] text-info transition-colors hover:bg-[#dcecff]"
          >
            <Mail className="h-4 w-4" />
          </a>
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
            <DropdownMenuItem>Editar</DropdownMenuItem>
            <DropdownMenuItem>Ver leads</DropdownMenuItem>
            <DropdownMenuItem>Transferir leads</DropdownMenuItem>
            <DropdownMenuItem>Resetar senha</DropdownMenuItem>
            <DropdownMenuItem variant="destructive">Desativar</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  )
}
