'use client'

import { ChevronDown } from 'lucide-react'
import { useState } from 'react'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { getInitials } from '@/lib/utils'
import { ROLE_META } from './constants'
import { MemberActionsMenu, type MemberActionKind } from './member-actions-menu'
import { memberActions, type MemberActor } from './permissions'
import type { Member } from './types'

function formatDate(iso: string | undefined): string {
  return iso ? new Date(iso).toLocaleDateString('pt-BR') : ''
}

/** Quem foi desativado: recolhida por padrão, com Reativar, Transferir carteira e Excluir */
export function InactiveSection({
  members,
  actor,
  isReactivating,
  onAction,
}: {
  members: Member[]
  actor: MemberActor | null
  isReactivating: boolean
  onAction: (kind: MemberActionKind, member: Member) => void
}) {
  const [open, setOpen] = useState(false)
  if (members.length === 0) return null

  return (
    <section className="space-y-3">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        className="flex min-h-11 w-full items-center justify-between gap-2 rounded-[16px] border-[0.5px] border-neutral-200 bg-white px-4 text-left"
      >
        <span className="text-[16px] font-semibold text-neutral-900">
          Inativos <span className="font-normal text-neutral-400">({members.length})</span>
        </span>
        <ChevronDown className={`h-4 w-4 text-neutral-400 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <ul className="space-y-2">
          {members.map((member) => {
            const actions = memberActions(actor, member)
            return (
              <li
                key={member.id}
                className="flex flex-col gap-3 rounded-[16px] border-[0.5px] border-neutral-200 bg-white p-4 sm:flex-row sm:items-center"
              >
                <div className="flex min-w-0 flex-1 items-start gap-3">
                  <Avatar className="size-11">
                    <AvatarFallback className="bg-neutral-100 text-sm text-neutral-400">{getInitials(member.name)}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-neutral-900">{member.name}</p>
                    <p className="text-xs text-neutral-400">
                      {ROLE_META[member.role].label}
                      {member.deactivatedAt && ` · desativado em ${formatDate(member.deactivatedAt)}`}
                      {member.deactivatedByName && ` por ${member.deactivatedByName}`}
                    </p>
                    {member.deactivationReason && (
                      <p className="mt-0.5 text-xs text-neutral-600">Motivo: {member.deactivationReason}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center justify-end gap-2">
                  {actions.activate && (
                    <button
                      type="button"
                      disabled={isReactivating}
                      onClick={() => onAction('activate', member)}
                      className="min-h-11 rounded-[8px] border-[1.5px] border-neutral-200 px-4 text-sm font-medium text-neutral-900 hover:border-brand hover:text-brand disabled:opacity-60"
                    >
                      Reativar
                    </button>
                  )}
                  <MemberActionsMenu
                    actions={{ ...actions, activate: false, edit: false, resetPassword: false }}
                    isSelf={false}
                    onAction={(kind) => onAction(kind, member)}
                  />
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}
