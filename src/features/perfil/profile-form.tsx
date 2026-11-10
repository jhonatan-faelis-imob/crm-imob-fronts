'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation } from '@tanstack/react-query'
import { Info } from 'lucide-react'
import { useForm, useWatch } from 'react-hook-form'
import { z } from 'zod'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { toast } from '@/components/ui/toast'
import { apiErrorMessage } from '@/features/equipe/api'
import { ROLE_META, ROLES } from '@/features/equipe/constants'
import { FormField, inputClassName, labelClassName } from '@/features/equipe/field'
import { MaskedInput } from '@/features/equipe/masked-input'
import { getInitials } from '@/lib/utils'
import { authService, type Profile, type ProfileChange } from '@/services/auth.service'
import { isValidProfilePhone, profilePhoneMask } from './rules'
import { useApplySession } from './use-apply-session'

const profileSchema = z.object({
  name: z.string().trim().min(1, 'Informe seu nome').max(120, 'Nome muito longo'),
  phone: z.string().refine(isValidProfilePhone, 'Telefone com DDD: 10 ou 11 dígitos'),
  creci: z.string().trim().max(30, 'CRECI muito longo'),
})

type ProfileFormValues = z.infer<typeof profileSchema>

function roleLabel(role: string) {
  const known = ROLES.find((item) => item === role)
  return known ? ROLE_META[known].label : role
}

function ReadOnlyField({ id, label, value }: { id: string; label: string; value: string }) {
  return (
    <div>
      <label htmlFor={id} className={labelClassName}>
        {label}
      </label>
      <input id={id} value={value} readOnly disabled className={`${inputClassName} bg-neutral-100 text-neutral-600`} />
    </div>
  )
}

/** Só os campos que mudaram: salvar sem mudança derrubaria as outras sessões à toa */
function changedFields(values: ProfileFormValues, profile: Profile): ProfileChange {
  const change: ProfileChange = {}
  if (values.name.trim() !== profile.name) change.name = values.name.trim()
  if (values.phone !== (profile.phone ?? '')) change.phone = values.phone
  if (values.creci.trim() !== (profile.creci ?? '')) change.creci = values.creci.trim()
  return change
}

export function ProfileForm({ profile }: { profile: Profile }) {
  const applySession = useApplySession()
  const {
    register,
    control,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isDirty },
  } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: { name: profile.name, phone: profile.phone ?? '', creci: profile.creci ?? '' },
  })
  const phone = useWatch({ control, name: 'phone' })

  const save = useMutation({
    mutationFn: authService.updateProfile,
    onSuccess: (result) => {
      applySession(result, result.user)
      reset({ name: result.user.name, phone: result.user.phone ?? '', creci: result.user.creci ?? '' })
      toast.add({ title: 'Dados salvos', description: 'Os outros aparelhos precisarão entrar de novo.', type: 'success' })
    },
    onError: (error) => {
      const message = apiErrorMessage(error, 'Não foi possível salvar. Tente de novo.')
      const field = /telefone/i.test(message) ? 'phone' : /nome/i.test(message) ? 'name' : /creci/i.test(message) ? 'creci' : 'root'
      setError(field, { message })
    },
  })

  function onSubmit(values: ProfileFormValues) {
    const change = changedFields(values, profile)
    if (Object.keys(change).length === 0) return
    save.mutate(change)
  }

  return (
    <section className="rounded-[16px] border-[0.5px] border-neutral-200 bg-white">
      <div className="border-b-[0.5px] border-neutral-200 p-4 sm:p-6">
        <h2 className="text-[18px] font-semibold text-neutral-900">Meus dados</h2>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4 p-4 sm:p-6">
        <div className="flex items-center gap-3">
          <Avatar className="size-14">
            <AvatarFallback className="bg-brand-bg text-lg text-brand">{getInitials(profile.name)}</AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="truncate text-[16px] font-semibold text-neutral-900">{profile.name}</p>
            <p className="truncate text-sm text-neutral-400">
              {roleLabel(profile.role)}
              {profile.teamName ? ` · ${profile.teamName}` : ''} · {profile.organizationName}
            </p>
          </div>
        </div>

        {phone.trim() === '' && (
          <div role="note" className="flex gap-2 rounded-[12px] bg-warning/10 p-3 text-sm text-warning">
            <Info className="mt-0.5 h-4 w-4 shrink-0" />
            <p>
              Seu telefone aparece na página dos imóveis que você compartilha. Sem ele, o cliente não vê o botão de
              WhatsApp.
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <FormField label="Nome" htmlFor="profile-name" required error={errors.name?.message}>
              <input id="profile-name" autoComplete="name" className={inputClassName} {...register('name')} />
            </FormField>
          </div>
          <FormField label="Telefone (WhatsApp)" htmlFor="profile-phone" error={errors.phone?.message}>
            <MaskedInput control={control} name="phone" mask={profilePhoneMask} id="profile-phone" placeholder="(00) 00000-0000" />
          </FormField>
          <FormField label="CRECI" htmlFor="profile-creci" error={errors.creci?.message}>
            <input id="profile-creci" className={inputClassName} {...register('creci')} />
          </FormField>
          <ReadOnlyField id="profile-email" label="E-mail" value={profile.email} />
          <ReadOnlyField id="profile-role" label="Cargo" value={roleLabel(profile.role)} />
        </div>
        <p className="text-xs text-neutral-400">Para alterar e-mail ou cargo, fale com um gestor.</p>

        {errors.root?.message && (
          <p role="alert" className="rounded-[12px] bg-danger/10 px-3 py-2 text-sm text-danger">
            {errors.root.message}
          </p>
        )}

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={!isDirty || save.isPending}
            className="min-h-11 w-full rounded-[8px] bg-brand px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-brand-dark disabled:opacity-60 sm:w-auto"
          >
            {save.isPending ? 'Salvando...' : 'Salvar dados'}
          </button>
        </div>
      </form>
    </section>
  )
}
