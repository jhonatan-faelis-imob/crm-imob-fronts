'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation } from '@tanstack/react-query'
import { ShieldAlert } from 'lucide-react'
import { useForm, useWatch } from 'react-hook-form'
import { z } from 'zod'
import { toast } from '@/components/ui/toast'
import { apiErrorMessage } from '@/features/equipe/api'
import { FormField, inputClassName } from '@/features/equipe/field'
import { cn } from '@/lib/utils'
import { authService } from '@/services/auth.service'
import { MIN_PASSWORD_LENGTH, passwordStrength } from './rules'
import { useApplySession } from './use-apply-session'

const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Informe a senha atual'),
    newPassword: z
      .string()
      .min(MIN_PASSWORD_LENGTH, `Mínimo de ${MIN_PASSWORD_LENGTH} caracteres`)
      .max(72, 'Máximo de 72 caracteres'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'As senhas não coincidem',
    path: ['confirmPassword'],
  })
  .refine((data) => data.newPassword !== data.currentPassword, {
    message: 'A nova senha precisa ser diferente da atual',
    path: ['newPassword'],
  })

type PasswordFormValues = z.infer<typeof passwordSchema>

const STRENGTH_COLORS = ['bg-neutral-200', 'bg-danger', 'bg-warning', 'bg-success'] as const

function StrengthMeter({ password }: { password: string }) {
  const { score, label } = passwordStrength(password)
  if (score === 0) return null
  return (
    <div className="mt-2 flex items-center gap-2" aria-live="polite">
      <div className="flex flex-1 gap-1">
        {[1, 2, 3].map((step) => (
          <span
            key={step}
            className={cn('h-1.5 flex-1 rounded-full', step <= score ? STRENGTH_COLORS[score] : 'bg-neutral-200')}
          />
        ))}
      </div>
      <span className="w-12 text-right text-xs text-neutral-600">{label}</span>
    </div>
  )
}

export function PasswordForm() {
  const applySession = useApplySession()
  const {
    register,
    control,
    handleSubmit,
    reset,
    setError,
    formState: { errors },
  } = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordSchema),
    defaultValues: { currentPassword: '', newPassword: '', confirmPassword: '' },
  })
  const newPassword = useWatch({ control, name: 'newPassword' })

  const change = useMutation({
    mutationFn: (values: PasswordFormValues) => authService.changePassword(values.currentPassword, values.newPassword),
    onSuccess: (tokens) => {
      applySession(tokens)
      reset()
      toast.add({ title: 'Senha alterada', description: 'Os outros aparelhos foram desconectados.', type: 'success' })
    },
    onError: (error) => {
      const message = apiErrorMessage(error, 'Não foi possível trocar a senha. Tente de novo.')
      if (/senha atual/i.test(message)) setError('currentPassword', { message })
      else if (/nova senha/i.test(message)) setError('newPassword', { message })
      else setError('root', { message })
    },
  })

  return (
    <section className="rounded-[16px] border-[0.5px] border-neutral-200 bg-white">
      <div className="border-b-[0.5px] border-neutral-200 p-4 sm:p-6">
        <h2 className="text-[18px] font-semibold text-neutral-900">Segurança</h2>
      </div>

      <form onSubmit={handleSubmit((values) => change.mutate(values))} noValidate className="space-y-4 p-4 sm:p-6">
        <div role="note" className="flex gap-2 rounded-[12px] bg-neutral-100 p-3 text-sm text-neutral-600">
          <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" />
          <p>Ao trocar a senha, você será desconectado nos outros aparelhos.</p>
        </div>

        <FormField label="Senha atual" htmlFor="current-password" required error={errors.currentPassword?.message}>
          <input
            id="current-password"
            type="password"
            autoComplete="current-password"
            className={inputClassName}
            {...register('currentPassword')}
          />
        </FormField>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField label="Nova senha" htmlFor="new-password" required error={errors.newPassword?.message}>
            <input
              id="new-password"
              type="password"
              autoComplete="new-password"
              className={inputClassName}
              {...register('newPassword')}
            />
            <StrengthMeter password={newPassword} />
          </FormField>
          <FormField label="Confirmar nova senha" htmlFor="confirm-password" required error={errors.confirmPassword?.message}>
            <input
              id="confirm-password"
              type="password"
              autoComplete="new-password"
              className={inputClassName}
              {...register('confirmPassword')}
            />
          </FormField>
        </div>

        {errors.root?.message && (
          <p role="alert" className="rounded-[12px] bg-danger/10 px-3 py-2 text-sm text-danger">
            {errors.root.message}
          </p>
        )}

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={change.isPending}
            className="min-h-11 w-full rounded-[8px] bg-brand px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-brand-dark disabled:opacity-60 sm:w-auto"
          >
            {change.isPending ? 'Trocando...' : 'Trocar senha'}
          </button>
        </div>
      </form>
    </section>
  )
}
