import { MoreVertical } from 'lucide-react'
import Link from 'next/link'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { hasAnyMemberAction, type MemberActions } from './permissions'

export type MemberActionKind = 'edit' | 'transfer' | 'resetPassword' | 'deactivate' | 'activate' | 'remove'

/** Só o que o usuário logado pode fazer com a pessoa. Editar a si mesmo leva ao perfil */
export function MemberActionsMenu({
  actions,
  isSelf,
  onAction,
}: {
  actions: MemberActions
  isSelf: boolean
  onAction: (kind: MemberActionKind) => void
}) {
  if (!hasAnyMemberAction(actions)) return null
  const hasDanger = actions.deactivate || actions.activate || actions.remove

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <button
            type="button"
            aria-label="Mais opções"
            className="flex size-9 shrink-0 items-center justify-center rounded-[8px] text-muted-foreground hover:bg-canvas hover:text-brand"
          />
        }
      >
        <MoreVertical className="h-4 w-4" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {actions.edit &&
          (isSelf ? (
            <DropdownMenuItem render={<Link href="/perfil" />}>Meu perfil</DropdownMenuItem>
          ) : (
            <DropdownMenuItem onClick={() => onAction('edit')}>Editar</DropdownMenuItem>
          ))}
        {actions.transfer && <DropdownMenuItem onClick={() => onAction('transfer')}>Transferir carteira</DropdownMenuItem>}
        {actions.resetPassword && (
          <DropdownMenuItem onClick={() => onAction('resetPassword')}>Resetar senha</DropdownMenuItem>
        )}
        {hasDanger && <DropdownMenuSeparator />}
        {actions.activate && <DropdownMenuItem onClick={() => onAction('activate')}>Reativar</DropdownMenuItem>}
        {actions.deactivate && (
          <DropdownMenuItem variant="destructive" onClick={() => onAction('deactivate')}>
            Desativar
          </DropdownMenuItem>
        )}
        {actions.remove && (
          <DropdownMenuItem variant="destructive" onClick={() => onAction('remove')}>
            Excluir
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
