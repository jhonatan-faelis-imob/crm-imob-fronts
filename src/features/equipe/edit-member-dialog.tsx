'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { toast } from '@/components/ui/toast'
import { usersService } from '@/services/users.service'
import type { Role } from '@/types'
import { apiErrorMessage, editErrorField } from './api'
import { ROLE_META, ROLES } from './constants'
import { FieldGrid, FormField, inputClassName } from './field'
import { MaskedInput } from './masked-input'
import { phoneMask } from './masks'
import { manageableRoles, type MemberActions } from './permissions'
import type { Member, TeamWithMetrics } from './types'
import { invalidateMemberChanges } from './use-member-actions'

const ROLE_VALUES = ROLES as [Role, ...Role[]]

const editSchema = z.object({
  name: z.string().trim().min(1, 'Informe o nome completo'),
  email: z.string().trim().min(1, 'Informe o email').email('Email inválido'),
  phone: z.string(),
  creci: z.string(),
  role: z.enum(ROLE_VALUES, { message: 'Selecione o cargo' }),
  teamId: z.string(),
})

type EditFormValues = z.infer<typeof editSchema>

/** Só o que mudou: qualquer gravação derruba a sessão da pessoa, então salvar sem mudança nem chama a API */
export function changedFields(
  member: Pick<Member, 'name' | 'email' | 'phone' | 'creci' | 'role' | 'teamId'>,
  values: EditFormValues,
  allowed: Pick<MemberActions, 'editEmail' | 'editRole'> & { editTeam: boolean },
): Record<string, string | null> {
  const dto: Record<string, string | null> = {}
  if (values.name.trim() !== member.name) dto.name = values.name.trim()
  if (allowed.editEmail && values.email.trim().toLowerCase() !== member.email.toLowerCase()) dto.email = values.email.trim()
  if (values.phone !== (member.phone ?? '')) dto.phone = values.phone
  if (values.creci.trim() !== (member.creci ?? '')) dto.creci = values.creci.trim()
  if (allowed.editRole && values.role !== member.role) dto.role = values.role
  if (allowed.editTeam && values.teamId !== (member.teamId ?? '')) dto.teamId = values.teamId || null
  return dto
}

function EditForm({
  member,
  teams,
  actorRole,
  actions,
  canEditTeam,
  onClose,
}: {
  member: Member
  teams: TeamWithMetrics[]
  actorRole: Role | undefined
  actions: MemberActions
  canEditTeam: boolean
  onClose: () => void
}) {
  const queryClient = useQueryClient()
  const roles = manageableRoles(actorRole)
  const roleOptions = roles.includes(member.role) ? roles : [member.role, ...roles]
  const {
    register,
    control,
    setError,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<EditFormValues>({
    resolver: zodResolver(editSchema),
    defaultValues: {
      name: member.name,
      email: member.email,
      phone: member.phone ?? '',
      creci: member.creci ?? '',
      role: member.role,
      teamId: member.teamId ?? '',
    },
  })

  async function submit(values: EditFormValues) {
    const dto = changedFields(member, values, { ...actions, editTeam: canEditTeam })
    if (Object.keys(dto).length === 0) {
      onClose()
      return
    }
    try {
      await usersService.update(member.id, dto)
      invalidateMemberChanges(queryClient)
      toast.add({ title: 'Dados atualizados', type: 'success' })
      onClose()
    } catch (error) {
      // O modal fica aberto e a mensagem do backend (403, 409) aparece no campo a que se refere
      const message = apiErrorMessage(error, 'Não foi possível salvar. Tente de novo.')
      setError(editErrorField(message), { message })
    }
  }

  return (
    <>
      <form onSubmit={handleSubmit(submit)} noValidate className="flex-1 space-y-4 overflow-y-auto p-4 sm:p-6">
        <FormField label="Nome completo" htmlFor="edit-member-name" required error={errors.name?.message}>
          <input id="edit-member-name" className={`${inputClassName} text-base`} {...register('name')} />
        </FormField>

        {actions.editEmail ? (
          <FormField label="Email" htmlFor="edit-member-email" required error={errors.email?.message}>
            <input id="edit-member-email" type="email" className={`${inputClassName} text-base`} {...register('email')} />
          </FormField>
        ) : (
          <p className="text-xs text-neutral-400">Email: {member.email} (só gerente ou superior altera)</p>
        )}

        <FieldGrid>
          <FormField label="Telefone" htmlFor="edit-member-phone" error={errors.phone?.message}>
            <MaskedInput control={control} name="phone" mask={phoneMask} id="edit-member-phone" placeholder="(00) 00000-0000" />
          </FormField>
          <FormField label="CRECI" htmlFor="edit-member-creci">
            <input id="edit-member-creci" className={`${inputClassName} text-base`} {...register('creci')} />
          </FormField>
        </FieldGrid>

        <FieldGrid>
          <FormField label="Cargo" htmlFor="edit-member-role" error={errors.role?.message}>
            <select
              id="edit-member-role"
              disabled={!actions.editRole}
              className={`${inputClassName} text-base disabled:opacity-60`}
              {...register('role')}
            >
              {roleOptions.map((role) => (
                <option key={role} value={role}>
                  {ROLE_META[role].label}
                </option>
              ))}
            </select>
          </FormField>
          {canEditTeam && (
            <FormField label="Equipe" htmlFor="edit-member-team" error={errors.teamId?.message}>
              <select id="edit-member-team" className={`${inputClassName} text-base`} {...register('teamId')}>
                <option value="">Sem equipe</option>
                {teams.map((team) => (
                  <option key={team.id} value={team.id}>
                    {team.name}
                  </option>
                ))}
              </select>
            </FormField>
          )}
        </FieldGrid>

        <p className="text-xs text-neutral-400">
          Mudar cargo, equipe ou email desconecta {member.name} dos aparelhos onde estiver logado.
        </p>

        {errors.root?.message && (
          <p role="alert" className="rounded-[12px] bg-danger/10 px-3 py-2 text-sm text-danger">
            {errors.root.message}
          </p>
        )}
      </form>

      <DialogFooter className="mx-0 mb-0 shrink-0 flex-row justify-end gap-2 rounded-b-2xl border-t-[0.5px] border-neutral-200 bg-white p-4 sm:p-6">
        <button
          type="button"
          onClick={onClose}
          className="min-h-11 rounded-[8px] border-[1.5px] border-neutral-200 px-4 text-sm font-medium text-neutral-600 hover:bg-neutral-100"
        >
          Cancelar
        </button>
        <button
          type="button"
          disabled={isSubmitting}
          onClick={handleSubmit(submit)}
          className="min-h-11 rounded-[8px] bg-brand px-4 text-sm font-medium text-white hover:bg-brand-dark disabled:opacity-60"
        >
          {isSubmitting ? 'Salvando...' : 'Salvar'}
        </button>
      </DialogFooter>
    </>
  )
}

export function EditMemberDialog({
  member,
  teams,
  actorRole,
  actions,
  canEditTeam,
  onClose,
}: {
  member: Member | null
  teams: TeamWithMetrics[]
  actorRole: Role | undefined
  actions: MemberActions
  /** Coordenador não muda equipe (só a própria) */
  canEditTeam: boolean
  onClose: () => void
}) {
  return (
    <Dialog open={member !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="flex max-h-[90vh] w-[calc(100%-2rem)] max-w-lg flex-col gap-0 rounded-2xl border-[0.5px] border-neutral-200 bg-white p-0 ring-0">
        <DialogHeader className="shrink-0 gap-1 border-b-[0.5px] border-neutral-200 p-4 pr-12 sm:p-6 sm:pr-14">
          <DialogTitle>Editar membro</DialogTitle>
          <DialogDescription>{member?.name}</DialogDescription>
        </DialogHeader>
        {member && (
          <EditForm
            key={member.id}
            member={member}
            teams={teams}
            actorRole={actorRole}
            actions={actions}
            canEditTeam={canEditTeam}
            onClose={onClose}
          />
        )}
      </DialogContent>
    </Dialog>
  )
}
