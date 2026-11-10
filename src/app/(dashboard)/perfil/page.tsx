'use client'

import { useQuery } from '@tanstack/react-query'
import { Skeleton } from '@/components/ui/skeleton'
import { PasswordForm } from '@/features/perfil/password-form'
import { ProfileForm } from '@/features/perfil/profile-form'
import { authService } from '@/services/auth.service'

export default function PerfilPage() {
  const { data: profile, isLoading, isError, refetch } = useQuery({
    queryKey: ['profile'],
    queryFn: authService.getProfile,
  })

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <p className="text-xs font-medium text-neutral-400">Conta</p>
        <h1 className="text-[28px] font-semibold text-neutral-900">Meu perfil</h1>
      </div>

      {isLoading && (
        <div className="space-y-6">
          <Skeleton className="h-96 rounded-[16px]" />
          <Skeleton className="h-72 rounded-[16px]" />
        </div>
      )}

      {isError && (
        <div className="rounded-[16px] border-[0.5px] border-neutral-200 bg-white p-6 text-center">
          <p className="text-sm text-neutral-600">Não foi possível carregar seu perfil.</p>
          <button
            type="button"
            onClick={() => refetch()}
            className="mt-3 min-h-11 rounded-[8px] border-[1.5px] border-neutral-200 px-4 text-sm font-medium text-neutral-900 hover:border-brand hover:text-brand"
          >
            Tentar de novo
          </button>
        </div>
      )}

      {profile && (
        <>
          {/* key: depois de salvar, o formulário recomeça com os dados novos */}
          <ProfileForm key={profile.id} profile={profile} />
          <PasswordForm />
        </>
      )}
    </div>
  )
}
