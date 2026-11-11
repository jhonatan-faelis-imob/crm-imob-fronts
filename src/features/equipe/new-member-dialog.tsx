'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { Camera } from 'lucide-react'
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
import { TemporaryPasswordBox } from '@/components/temporary-password-box'
import type { Role } from '@/types'
import { apiErrorMessage, memberErrorField, type CreatedUser } from './api'
import { ROLE_META, ROLES } from './constants'
import { FieldGrid, FormField, inputClassName, labelClassName } from './field'
import { MaskedInput } from './masked-input'
import { cpfMask, phoneMask } from './masks'
import { manageableRoles } from './permissions'
import type { TeamWithMetrics } from './types'

const ROLE_VALUES = ROLES as [Role, ...Role[]]

const newMemberSchema = z
  .object({
    name: z.string().min(1, 'Informe o nome completo'),
    email: z.string().trim().min(1, 'Informe o email').email('Email inválido'),
    phone: z.string().optional(),
    cpf: z.string().optional(),
    creci: z.string().optional(),
    role: z.enum(ROLE_VALUES, { message: 'Selecione o cargo' }),
    teamId: z.string(),
    passwordMode: z.enum(['auto', 'manual']),
    password: z.string(),
    confirmPassword: z.string(),
  })
  .refine((data) => data.passwordMode === 'auto' || data.password.length >= 8, {
    message: 'Mínimo de 8 caracteres',
    path: ['password'],
  })
  .refine((data) => data.passwordMode === 'auto' || data.password === data.confirmPassword, {
    message: 'As senhas não coincidem',
    path: ['confirmPassword'],
  })

export type NewMemberFormValues = z.infer<typeof newMemberSchema>

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

const secondaryButton =
  'rounded-[8px] border-[1.5px] border-neutral-200 px-4 py-2.5 text-sm font-medium text-neutral-600 transition-colors hover:bg-neutral-100'
const primaryButton =
  'rounded-[8px] bg-brand px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-brand-dark disabled:opacity-60'

function PasswordModeOption({
  checked,
  label,
  onSelect,
}: {
  checked: boolean
  label: string
  onSelect: () => void
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={checked}
      onClick={onSelect}
      className={`flex-1 rounded-[12px] border-[1.5px] px-3 py-2.5 text-left text-sm font-medium transition-colors ${
        checked ? 'border-brand bg-brand-bg text-brand' : 'border-neutral-200 text-neutral-600 hover:border-brand'
      }`}
    >
      {label}
    </button>
  )
}

// Montado de novo (key) a cada abertura, então sempre começa limpo sem efeito para resetar
function NewMemberFormBody({
  teams,
  actorRole,
  requiredTeamId,
  onCancel,
  onSubmit,
}: {
  teams: TeamWithMetrics[]
  actorRole: Role | undefined
  requiredTeamId: string | null
  onCancel: () => void
  onSubmit: (data: NewMemberFormValues) => Promise<void>
}) {
  const roles = manageableRoles(actorRole)
  const {
    register,
    control,
    setValue,
    setError,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<NewMemberFormValues>({
    resolver: zodResolver(newMemberSchema),
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      cpf: '',
      creci: '',
      role: roles.includes('corretor') ? 'corretor' : roles[0],
      teamId: requiredTeamId ?? '',
      passwordMode: 'auto',
      password: '',
      confirmPassword: '',
    },
  })
  const passwordMode = useWatch({ control, name: 'passwordMode' })

  // Erro da API: mantém o modal aberto e mostra a mensagem no campo a que ela se refere
  async function submit(data: NewMemberFormValues) {
    try {
      await onSubmit(data)
    } catch (error) {
      const message = apiErrorMessage(error, 'Não foi possível criar o membro. Tente de novo.')
      setError(memberErrorField(message), { message })
    }
  }

  return (
    <>
      <form onSubmit={handleSubmit(submit)} noValidate className="flex-1 space-y-4 overflow-y-auto p-4 sm:p-6">
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
              {roles.map((roleOption) => (
                <option key={roleOption} value={roleOption}>
                  {ROLE_META[roleOption].label}
                </option>
              ))}
            </select>
          </FormField>
        </FieldGrid>

        <FormField label="Equipe" htmlFor="new-member-team" error={errors.teamId?.message}>
          <select id="new-member-team" className={inputClassName} {...register('teamId')}>
            {/* Coordenador só cria na própria equipe: sem equipe, a pessoa sumiria da visão dele */}
            {!requiredTeamId && <option value="">Sem equipe (definir depois)</option>}
            {teams.map((team) => (
              <option key={team.id} value={team.id}>
                {team.name}
              </option>
            ))}
          </select>
        </FormField>

        <div>
          <p className={labelClassName}>Senha</p>
          <div role="radiogroup" aria-label="Senha" className="flex gap-2">
            <PasswordModeOption
              checked={passwordMode === 'auto'}
              label="Gerar senha automaticamente"
              onSelect={() => setValue('passwordMode', 'auto', { shouldValidate: true })}
            />
            <PasswordModeOption
              checked={passwordMode === 'manual'}
              label="Definir agora"
              onSelect={() => setValue('passwordMode', 'manual')}
            />
          </div>
          {passwordMode === 'auto' && (
            <p className="mt-1.5 text-xs text-neutral-400">A senha aparece uma única vez depois de criar.</p>
          )}
        </div>

        {passwordMode === 'manual' && (
          <FieldGrid>
            <FormField label="Senha" htmlFor="new-member-password" required error={errors.password?.message}>
              <input id="new-member-password" type="password" autoComplete="new-password" className={inputClassName} {...register('password')} />
            </FormField>
            <FormField
              label="Confirmar senha"
              htmlFor="new-member-confirm-password"
              required
              error={errors.confirmPassword?.message}
            >
              <input
                id="new-member-confirm-password"
                type="password"
                autoComplete="new-password"
                className={inputClassName}
                {...register('confirmPassword')}
              />
            </FormField>
          </FieldGrid>
        )}

        {errors.root?.message && (
          <p role="alert" className="rounded-[12px] bg-danger/10 px-3 py-2 text-sm text-danger">
            {errors.root.message}
          </p>
        )}
      </form>

      <DialogFooter className="mx-0 mb-0 shrink-0 flex-row justify-end gap-2 rounded-b-2xl border-t-[0.5px] border-neutral-200 bg-white p-4 sm:p-6">
        <button type="button" onClick={onCancel} className={secondaryButton}>
          Cancelar
        </button>
        <button type="button" disabled={isSubmitting} onClick={handleSubmit(submit)} className={primaryButton}>
          {isSubmitting ? 'Criando...' : 'Criar membro'}
        </button>
      </DialogFooter>
    </>
  )
}

function TemporaryPasswordView({ user, onClose }: { user: CreatedUser & { temporaryPassword: string }; onClose: () => void }) {
  return (
    <>
      <div className="flex-1 space-y-4 overflow-y-auto p-4 sm:p-6">
        <p className="text-sm text-neutral-600">
          <span className="font-medium text-neutral-900">{user.name}</span> foi criado. Repasse o email e a senha
          temporária abaixo.
        </p>
        <TemporaryPasswordBox password={user.temporaryPassword} />
        <p className="text-xs text-neutral-400">Login: {user.email}</p>
      </div>
      <DialogFooter className="mx-0 mb-0 shrink-0 flex-row justify-end gap-2 rounded-b-2xl border-t-[0.5px] border-neutral-200 bg-white p-4 sm:p-6">
        <button type="button" onClick={onClose} className={primaryButton}>
          Concluir
        </button>
      </DialogFooter>
    </>
  )
}

export function NewMemberDialog({
  open,
  onOpenChange,
  teams,
  actorRole,
  requiredTeamId,
  onCreate,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Equipes em que quem cria pode colocar a pessoa */
  teams: TeamWithMetrics[]
  actorRole: Role | undefined
  /** Coordenador: a pessoa entra obrigatoriamente na equipe dele */
  requiredTeamId: string | null
  /** Rejeita em caso de erro: o formulário mostra a mensagem no campo certo */
  onCreate: (data: NewMemberFormValues) => Promise<CreatedUser>
}) {
  const [created, setCreated] = useState<(CreatedUser & { temporaryPassword: string }) | null>(null)

  function handleOpenChange(next: boolean) {
    if (!next) setCreated(null)
    onOpenChange(next)
  }

  async function handleSubmit(data: NewMemberFormValues) {
    // Só fecha (ou mostra a senha) com 2xx; o erro sobe para o formulário
    const user = await onCreate(data)
    if (user.temporaryPassword) setCreated({ ...user, temporaryPassword: user.temporaryPassword })
    else handleOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="flex max-h-[90vh] w-[calc(100%-2rem)] max-w-lg flex-col gap-0 rounded-2xl border-[0.5px] border-neutral-200 bg-white p-0 ring-0">
        <DialogHeader className="shrink-0 gap-1 border-b-[0.5px] border-neutral-200 p-4 pr-12 sm:p-6 sm:pr-14">
          <DialogTitle>{created ? 'Membro criado' : 'Novo membro'}</DialogTitle>
          <DialogDescription>
            {created ? 'Guarde a senha antes de fechar.' : 'Equipe e senha podem ficar para depois.'}
          </DialogDescription>
        </DialogHeader>

        {open && created && <TemporaryPasswordView user={created} onClose={() => handleOpenChange(false)} />}
        {open && !created && (
          <NewMemberFormBody
            key="new-member"
            teams={teams}
            actorRole={actorRole}
            requiredTeamId={requiredTeamId}
            onCancel={() => handleOpenChange(false)}
            onSubmit={handleSubmit}
          />
        )}
      </DialogContent>
    </Dialog>
  )
}
