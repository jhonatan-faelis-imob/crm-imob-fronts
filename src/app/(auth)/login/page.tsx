'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Mail, Lock, Eye, EyeOff, Loader2 } from 'lucide-react'
import { authService } from '@/services/auth.service'
import { useAuthStore } from '@/store/auth.store'

const loginSchema = z.object({
  email: z.string().min(1, 'Informe seu email').email('Digite um email válido'),
  password: z.string().min(6, 'A senha deve ter no mínimo 6 caracteres'),
})

type LoginFormData = z.infer<typeof loginSchema>

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false)
  const [authError, setAuthError] = useState<string | null>(null)
  const router = useRouter()

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  })

  async function onSubmit(data: LoginFormData) {
    try {
      setAuthError(null)
      const response = await authService.login(data.email, data.password)
      useAuthStore.getState().setAuth(response.user, response.accessToken, response.refreshToken)
      router.push('/dashboard')
    } catch {
      setAuthError('Email ou senha incorretos')
    }
  }

  return (
    <main className="flex min-h-screen flex-col bg-page lg:flex-row">
      <div className="hidden bg-brand p-12 text-white lg:flex lg:w-1/2 lg:flex-col">
        <span className="text-xl font-semibold">CRM Imob</span>

        <div className="flex flex-1 flex-col items-start justify-center">
          <h1 className="max-w-md text-[32px] font-semibold leading-tight">
            Transforme leads em contratos assinados
          </h1>
          <p className="mt-3 max-w-sm text-base text-white/80">
            Centralize seu funil, nunca mais perca um follow-up e acompanhe suas metas de VGV em
            tempo real.
          </p>
        </div>
      </div>

      <div className="flex flex-1 items-center justify-center p-4 sm:p-6 lg:w-1/2 lg:p-12">
        <div className="w-full max-w-sm rounded-[16px] border-[0.5px] border-neutral-200 bg-white p-8">
          <div className="mb-8 text-center text-xl font-semibold text-neutral-900 lg:hidden">
            CRM <span className="text-brand">Imob</span>
          </div>

          <h2 className="text-[20px] font-semibold text-neutral-900">Bem-vindo de volta</h2>
          <p className="mt-1 text-sm text-neutral-400">
            Entre com suas credenciais para acessar
          </p>

          {authError && (
            <div className="mt-4 rounded-[12px] border-[0.5px] border-[#FECDD3] bg-danger-bg px-3 py-2.5 text-sm text-danger">
              {authError}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} noValidate className="mt-6 space-y-4">
            <div>
              <label
                htmlFor="email"
                className="mb-1.5 block text-[13px] font-medium text-neutral-900"
              >
                Email
              </label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-neutral-400" />
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  placeholder="voce@imobiliaria.com"
                  aria-invalid={!!errors.email}
                  className="w-full rounded-[12px] border-[1.5px] border-neutral-200 bg-white py-2.5 pl-10 pr-3 text-[15px] text-neutral-900 outline-none transition-colors placeholder:text-neutral-400 focus:border-brand"
                  {...register('email')}
                />
              </div>
              {errors.email && (
                <p className="mt-1 text-[12px] text-danger">{errors.email.message}</p>
              )}
            </div>

            <div>
              <label
                htmlFor="password"
                className="mb-1.5 block text-[13px] font-medium text-neutral-900"
              >
                Senha
              </label>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-neutral-400" />
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder="••••••••"
                  aria-invalid={!!errors.password}
                  className="w-full rounded-[12px] border-[1.5px] border-neutral-200 bg-white py-2.5 pl-10 pr-10 text-[15px] text-neutral-900 outline-none transition-colors placeholder:text-neutral-400 focus:border-brand"
                  {...register('password')}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
                >
                  {showPassword ? (
                    <EyeOff className="h-[18px] w-[18px]" />
                  ) : (
                    <Eye className="h-[18px] w-[18px]" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1 text-[12px] text-danger">{errors.password.message}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="flex w-full items-center justify-center gap-2 rounded-[8px] bg-brand py-2.5 text-sm font-medium text-white transition-colors hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
              Entrar
            </button>
          </form>

          <div className="mt-4 space-y-2 text-center">
            <button
              type="button"
              className="text-sm font-medium text-neutral-600 hover:text-brand"
            >
              Esqueci minha senha
            </button>
            <p className="text-sm text-neutral-400">
              Não tem conta?{' '}
              <Link href="/cadastro" className="font-medium text-brand hover:text-brand-dark">
                Cadastre sua imobiliária
              </Link>
            </p>
          </div>
        </div>
      </div>
    </main>
  )
}
