'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { Camera, RefreshCw } from 'lucide-react'
import { useRef, useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { z } from 'zod'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import type { Role } from '@/types'
import { ROLE_META, ROLES, ROLES_WITH_TEAM } from './constants'
import { errorClassName, FieldGrid, FormField, inputClassName, labelClassName } from './field'
import { MaskedInput } from './masked-input'
import { cpfMask, phoneMask } from './masks'
import type { TeamWithMetrics } from './types'

const ROLE_VALUES = ROLES as [Role, ...Role[]]

const newMemberSchema = z
  .object({
    name: z.string().min(1, 'Informe o nome completo'),
    email: z.string().min(1, 'Informe o email').email('Email inválido'),
    phone: z.string().optional(),
    cpf: z.string().optional(),
    creci: z.string().optional(),
    role: z.enum(ROLE_VALUES, { message: 'Selecione o cargo' }),
    teamId: z.string().optional(),
    password: z.string().min(6, 'Mínimo de 6 caracteres'),
    confirmPassword: z.string().min(1, 'Confirme a senha'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'As senhas não coincidem',
    path: ['confirmPassword'],
  })
  .refine((data) => !ROLES_WITH_TEAM.includes(data.role) || Boolean(data.teamId), {
    message: 'Selecione a equipe',
    path: ['teamId'],
  })

export type NewMemberFormValues = z.infer<typeof newMemberSchema>

const emptyDefaultValues: NewMemberFormValues = {
  name: '',
  email: '',
  phone: '',
  cpf: '',
  creci: '',
  role: 'corretor',
  teamId: '',
  password: '',
  confirmPassword: '',
}

function generatePassword() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789'
  let result = ''
  for (let i = 0; i < 10; i += 1) {
    result += chars[Math.floor(Math.random() * chars.length)]
  }
  return result
}

function PhotoPicker() {
  const inputRef = useRef<HTMLInputElement>(null)
  const [preview, setPreview] = useState<string | null>(null)

  return (
    <div className="flex justify-center">
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        aria-label="Selecionar foto de perfil"
        className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-full border-2 border-dashed border-neutral-200 bg-neutral-100 text-neutral-400 transition-colors hover:border-brand hover:text-brand"
      >
        {preview ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={preview} alt="Prévia da foto de perfil" className="h-full w-full object-cover" />
        ) : (
          <Camera className="h-6 w-6" />
        )}
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0]
          if (!file) return
          const reader = new FileReader()
          reader.onload = () => setPreview(typeof reader.result === 'string' ? reader.result : null)
          reader.readAsDataURL(file)
        }}
      />
    </div>
  )
}

// Mounted fresh via a `key` every time the dialog opens, so it always starts
// with clean values without needing an effect to reset state.
function NewMemberFormBody({
  teams,
  onCancel,
  onSubmit,
}: {
  teams: TeamWithMetrics[]
  onCancel: () => void
  onSubmit: (data: NewMemberFormValues) => void
}) {
  const {
    register,
    control,
    setValue,
    handleSubmit,
    formState: { errors },
  } = useForm<NewMemberFormValues>({
    resolver: zodResolver(newMemberSchema),
    defaultValues: emptyDefaultValues,
  })

  const role = useWatch({ control, name: 'role' })
  const requiresTeam = ROLES_WITH_TEAM.includes(role)

  function handleGeneratePassword() {
    const generated = generatePassword()
    setValue('password', generated, { shouldValidate: true })
    setValue('confirmPassword', generated, { shouldValidate: true })
  }

  return (
    <>
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex-1 space-y-4 overflow-y-auto p-4 sm:p-6">
        <PhotoPicker />

        <FormField label="Nome completo" htmlFor="new-member-name" required error={errors.name?.message}>
          <input id="new-member-name" className={inputClassName} {...register('name')} />
        </FormField>

        <FormField label="Email" htmlFor="new-member-email" required error={errors.email?.message}>
          <input id="new-member-email" type="email" className={inputClassName} {...register('email')} />
        </FormField>

        <FieldGrid>
          <FormField label="Telefone" htmlFor="new-member-phone">
            <MaskedInput control={control} name="phone" mask={phoneMask} id="new-member-phone" placeholder="(00) 00000-0000" />
          </FormField>
          <FormField label="CPF" htmlFor="new-member-cpf">
            <MaskedInput control={control} name="cpf" mask={cpfMask} id="new-member-cpf" placeholder="000.000.000-00" />
          </FormField>
        </FieldGrid>

        <FieldGrid>
          <FormField label="CRECI" htmlFor="new-member-creci">
            <input id="new-member-creci" className={inputClassName} {...register('creci')} />
          </FormField>
          <FormField label="Cargo" htmlFor="new-member-role" required error={errors.role?.message}>
            <select id="new-member-role" className={inputClassName} {...register('role')}>
              {ROLES.map((roleOption) => (
                <option key={roleOption} value={roleOption}>
                  {ROLE_META[roleOption].label}
                </option>
              ))}
            </select>
          </FormField>
        </FieldGrid>

        {requiresTeam && (
          <FormField label="Equipe" htmlFor="new-member-team" required error={errors.teamId?.message}>
            <select id="new-member-team" defaultValue="" className={inputClassName} {...register('teamId')}>
              <option value="" disabled>
                Selecione a equipe
              </option>
              {teams.map((team) => (
                <option key={team.id} value={team.id}>
                  {team.name}
                </option>
              ))}
            </select>
          </FormField>
        )}

        <div>
          <label htmlFor="new-member-password" className={labelClassName}>
            Senha provisória
            <span className="text-brand"> *</span>
          </label>
          <div className="flex gap-2">
            <input id="new-member-password" className={inputClassName} {...register('password')} />
            <button
              type="button"
              onClick={handleGeneratePassword}
              aria-label="Gerar senha aleatória"
              className="flex shrink-0 items-center gap-1.5 rounded-[8px] border-[1.5px] border-neutral-200 px-3 text-sm font-medium text-neutral-600 transition-colors hover:border-brand hover:text-brand"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Gerar
            </button>
          </div>
          {errors.password && <p className={errorClassName}>{errors.password.message}</p>}
        </div>

        <FormField
          label="Confirmar senha"
          htmlFor="new-member-confirm-password"
          required
          error={errors.confirmPassword?.message}
        >
          <input id="new-member-confirm-password" className={inputClassName} {...register('confirmPassword')} />
        </FormField>
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
          onClick={handleSubmit(onSubmit)}
          className="rounded-[8px] bg-brand px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-brand-dark"
        >
          Criar membro
        </button>
      </DialogFooter>
    </>
  )
}

export function NewMemberDialog({
  open,
  onOpenChange,
  teams,
  onCreate,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  teams: TeamWithMetrics[]
  onCreate: (data: NewMemberFormValues) => void
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[90vh] w-[calc(100%-2rem)] max-w-lg flex-col gap-0 rounded-2xl border-[0.5px] border-neutral-200 bg-white p-0 ring-0">
        <DialogHeader className="shrink-0 gap-1 border-b-[0.5px] border-neutral-200 p-4 pr-12 sm:p-6 sm:pr-14">
          <DialogTitle>Novo membro</DialogTitle>
          <DialogDescription>Cadastre um novo integrante da equipe.</DialogDescription>
        </DialogHeader>

        {open && (
          <NewMemberFormBody
            key="new-member"
            teams={teams}
            onCancel={() => onOpenChange(false)}
            onSubmit={(data) => {
              onCreate(data)
              onOpenChange(false)
            }}
          />
        )}
      </DialogContent>
    </Dialog>
  )
}
