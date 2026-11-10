'use client'

import { zodResolver } from '@hookform/resolvers/zod'
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
import { ROLE_META } from './constants'
import { errorClassName, FormField, inputClassName, labelClassName } from './field'
import { MemberMultiSelect } from './member-multi-select'
import type { Member } from './types'

const newTeamSchema = z.object({
  name: z.string().min(1, 'Informe o nome da equipe'),
  /** '' = definir depois */
  coordinatorId: z.string(),
  description: z.string().optional(),
  memberIds: z.array(z.string()),
})

export type NewTeamFormValues = z.infer<typeof newTeamSchema>

const emptyDefaultValues: NewTeamFormValues = {
  name: '',
  coordinatorId: '',
  description: '',
  memberIds: [],
}

// Montado de novo (key) a cada abertura, então sempre começa limpo
function NewTeamFormBody({
  coordinators,
  withoutTeam,
  onCancel,
  onSubmit,
}: {
  coordinators: Member[]
  withoutTeam: Member[]
  onCancel: () => void
  onSubmit: (data: NewTeamFormValues) => Promise<void>
}) {
  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<NewTeamFormValues>({
    resolver: zodResolver(newTeamSchema),
    defaultValues: emptyDefaultValues,
  })

  return (
    <>
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex-1 space-y-4 overflow-y-auto p-4 sm:p-6">
        <FormField label="Nome da equipe" htmlFor="new-team-name" required error={errors.name?.message}>
          <input id="new-team-name" className={inputClassName} {...register('name')} />
        </FormField>

        <FormField label="Coordenador" htmlFor="new-team-coordinator" error={errors.coordinatorId?.message}>
          <select id="new-team-coordinator" className={inputClassName} {...register('coordinatorId')}>
            <option value="">Definir depois</option>
            {coordinators.map((coordinator) => (
              <option key={coordinator.id} value={coordinator.id}>
                {coordinator.name} · {ROLE_META[coordinator.role].label}
              </option>
            ))}
          </select>
          <p className="mt-1.5 text-xs text-neutral-400">Você pode criar a equipe agora e definir o coordenador depois.</p>
        </FormField>

        <FormField label="Descrição" htmlFor="new-team-description">
          <textarea id="new-team-description" rows={3} className={inputClassName} {...register('description')} />
        </FormField>

        <div>
          <label className={labelClassName}>Membros iniciais</label>
          <MemberMultiSelect
            control={control}
            name="memberIds"
            options={withoutTeam}
            emptyText="Ninguém sem equipe no momento."
          />
          {errors.memberIds && <p className={errorClassName}>{errors.memberIds.message}</p>}
        </div>
      </form>

      <DialogFooter className="mx-0 mb-0 shrink-0 flex-row justify-end gap-2 rounded-b-2xl border-t-[0.5px] border-neutral-200 bg-white p-4 sm:p-6">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-[8px] border-[1.5px] border-neutral-200 px-4 py-2.5 text-sm font-medium text-neutral-600 transition-colors hover:bg-neutral-100"
        >
          Cancelar
        </button>
        <button
          type="button"
          disabled={isSubmitting}
          onClick={handleSubmit(onSubmit)}
          className="rounded-[8px] bg-brand px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-brand-dark disabled:opacity-60"
        >
          {isSubmitting ? 'Criando...' : 'Criar equipe'}
        </button>
      </DialogFooter>
    </>
  )
}

export function NewTeamDialog({
  open,
  onOpenChange,
  coordinators,
  withoutTeam,
  onCreate,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Coordenador ou superior que ainda não coordena outra equipe (availableCoordinators) */
  coordinators: Member[]
  /** Todos os usuários sem equipe */
  withoutTeam: Member[]
  /** Rejeita em caso de erro (o toast fica com quem chama) */
  onCreate: (data: NewTeamFormValues) => Promise<unknown>
}) {
  async function handleSubmit(data: NewTeamFormValues) {
    try {
      await onCreate(data)
      onOpenChange(false)
    } catch {
      // Fica aberto para corrigir
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[90vh] w-[calc(100%-2rem)] max-w-md flex-col gap-0 rounded-2xl border-[0.5px] border-neutral-200 bg-white p-0 ring-0">
        <DialogHeader className="shrink-0 gap-1 border-b-[0.5px] border-neutral-200 p-4 pr-12 sm:p-6 sm:pr-14">
          <DialogTitle>Nova equipe</DialogTitle>
          <DialogDescription>Coordenador e membros podem ficar para depois.</DialogDescription>
        </DialogHeader>

        {open && (
          <NewTeamFormBody
            key="new-team"
            coordinators={coordinators}
            withoutTeam={withoutTeam}
            onCancel={() => onOpenChange(false)}
            onSubmit={handleSubmit}
          />
        )}
      </DialogContent>
    </Dialog>
  )
}
