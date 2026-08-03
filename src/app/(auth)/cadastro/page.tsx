'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import axios from 'axios'
import { Building2, User, Mail, Phone, Lock, Eye, EyeOff, Loader2, Check } from 'lucide-react'
import { authService } from '@/services/auth.service'
import { organizationsService } from '@/services/organizations.service'
import { useAuthStore } from '@/store/auth.store'
import { MaskedInput } from '@/features/leads/lead-form/masked-input'
import { phoneMask } from '@/features/leads/lead-form/masks'

const cadastroSchema = z.object({
  org: z.object({
    orgName: z.string().min(1, 'Informe o nome da imobiliária'),
    slug: z
      .string()
      .min(1, 'Informe o slug')
      .regex(/^[a-z0-9-]+$/, 'Use apenas letras minúsculas, números e hífens'),
  }),
  director: z
    .object({
      name: z.string().min(1, 'Informe seu nome completo'),
      email: z.string().min(1, 'Informe seu email').email('Digite um email válido'),
      phone: z.string().optional(),
      password: z.string().min(6, 'A senha deve ter no mínimo 6 caracteres'),
      confirmPassword: z.string().min(1, 'Confirme sua senha'),
    })
    .refine((data) => data.password === data.confirmPassword, {
      message: 'As senhas não coincidem',
      path: ['confirmPassword'],
    }),
})

type CadastroFormValues = z.infer<typeof cadastroSchema>

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
}

const STEPS = [
  { label: 'Imobiliária' },
  { label: 'Diretor' },
] as const

export default function CadastroPage() {
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [slugTouched, setSlugTouched] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    trigger,
    watch,
    setValue,
    control,
    formState: { errors, isSubmitting },
  } = useForm<CadastroFormValues>({
    resolver: zodResolver(cadastroSchema),
    defaultValues: {
      org: { orgName: '', slug: '' },
      director: { name: '', email: '', phone: '', password: '', confirmPassword: '' },
    },
  })

  const orgName = watch('org.orgName')

  useEffect(() => {
    if (!slugTouched) {
      setValue('org.slug', slugify(orgName ?? ''))
    }
  }, [orgName, slugTouched, setValue])

  async function goToStep2() {
    const isValid = await trigger(['org.orgName', 'org.slug'])
    if (isValid) setStep(1)
  }

  async function onSubmit(data: CadastroFormValues) {
    try {
      setSubmitError(null)
      await organizationsService.onboarding({
        orgName: data.org.orgName,
        slug: data.org.slug,
        name: data.director.name,
        email: data.director.email,
        phone: data.director.phone || undefined,
        password: data.director.password,
      })

      const auth = await authService.login(data.director.email, data.director.password)
      useAuthStore.getState().setAuth(auth.user, auth.accessToken, auth.refreshToken)
      router.push('/dashboard')
    } catch (error) {
      if (axios.isAxiosError(error) && typeof error.response?.data?.message === 'string') {
        setSubmitError(error.response.data.message)
      } else {
        setSubmitError('Não foi possível criar a conta. Tente novamente.')
      }
    }
  }

  return (
    <main className="flex min-h-screen flex-col bg-page lg:flex-row">
      <div className="hidden bg-brand p-12 text-white lg:flex lg:w-1/2 lg:flex-col">
        <span className="text-xl font-semibold">CRM Imob</span>

        <div className="flex flex-1 flex-col items-start justify-center">
          <h1 className="max-w-md text-[32px] font-semibold leading-tight">
            Comece agora gratuitamente
          </h1>
          <p className="mt-3 max-w-sm text-base text-white/80">
            Cadastre sua imobiliária, monte sua equipe e centralize todo o funil de vendas em um só
            lugar.
          </p>
        </div>
      </div>

      <div className="flex flex-1 items-center justify-center p-4 sm:p-6 lg:w-1/2 lg:p-12">
        <div className="w-full max-w-sm rounded-[16px] border-[0.5px] border-neutral-200 bg-white p-8">
          <div className="mb-8 text-center text-xl font-semibold text-neutral-900 lg:hidden">
            CRM <span className="text-brand">Imob</span>
          </div>

          <div className="flex items-center gap-2">
            {STEPS.map((item, index) => (
              <div key={item.label} className="flex flex-1 items-center gap-2">
                <div
                  className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold transition-colors ${
                    index < step
                      ? 'bg-brand text-white'
                      : index === step
                        ? 'bg-brand-bg text-brand ring-1 ring-brand'
                        : 'bg-neutral-100 text-neutral-400'
                  }`}
                >
                  {index < step ? <Check className="h-3.5 w-3.5" /> : index + 1}
                </div>
                <span
                  className={`text-xs font-medium ${
                    index <= step ? 'text-neutral-900' : 'text-neutral-400'
                  }`}
                >
                  {item.label}
                </span>
                {index < STEPS.length - 1 && (
                  <div
                    className={`h-px flex-1 ${index < step ? 'bg-brand' : 'bg-neutral-200'}`}
                  />
                )}
              </div>
            ))}
          </div>

          <h2 className="mt-6 text-[20px] font-semibold text-neutral-900">
            {step === 0 ? 'Dados da imobiliária' : 'Dados do diretor'}
          </h2>
          <p className="mt-1 text-sm text-neutral-400">
            {step === 0
              ? 'Como sua imobiliária vai aparecer no sistema'
              : 'Você será o administrador principal da conta'}
          </p>

          {submitError && (
            <div className="mt-4 rounded-[12px] border-[0.5px] border-[#FECDD3] bg-danger-bg px-3 py-2.5 text-sm text-danger">
              {submitError}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} noValidate className="mt-6 space-y-4">
            {step === 0 ? (
              <>
                <div>
                  <label htmlFor="orgName" className="mb-1.5 block text-[13px] font-medium text-neutral-900">
                    Nome da imobiliária
                  </label>
                  <div className="relative">
                    <Building2 className="pointer-events-none absolute left-3 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-neutral-400" />
                    <input
                      id="orgName"
                      type="text"
                      autoComplete="organization"
                      placeholder="Imobiliária Alpha"
                      aria-invalid={!!errors.org?.orgName}
                      className="w-full rounded-[12px] border-[1.5px] border-neutral-200 bg-white py-2.5 pl-10 pr-3 text-[15px] text-neutral-900 outline-none transition-colors placeholder:text-neutral-400 focus:border-brand"
                      {...register('org.orgName')}
                    />
                  </div>
                  {errors.org?.orgName && (
                    <p className="mt-1 text-[12px] text-danger">{errors.org.orgName.message}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="slug" className="mb-1.5 block text-[13px] font-medium text-neutral-900">
                    Slug
                  </label>
                  <input
                    id="slug"
                    type="text"
                    placeholder="imobiliaria-alpha"
                    aria-invalid={!!errors.org?.slug}
                    className="w-full rounded-[12px] border-[1.5px] border-neutral-200 bg-white px-3 py-2.5 text-[15px] text-neutral-900 outline-none transition-colors placeholder:text-neutral-400 focus:border-brand"
                    {...register('org.slug', { onChange: () => setSlugTouched(true) })}
                  />
                  <p className="mt-1 text-[12px] text-neutral-400">
                    Identifica sua imobiliária no sistema. Gerado automaticamente, mas você pode
                    editar.
                  </p>
                  {errors.org?.slug && (
                    <p className="mt-1 text-[12px] text-danger">{errors.org.slug.message}</p>
                  )}
                </div>

                <div>
                  <span className="mb-1.5 block text-[13px] font-medium text-neutral-900">Plano</span>
                  <div className="flex items-center justify-between rounded-[12px] border-[1.5px] border-neutral-200 bg-neutral-100 px-3 py-2.5">
                    <span className="text-[15px] font-medium text-neutral-900">Gratuito</span>
                    <span className="rounded-full bg-brand-bg px-2.5 py-1 text-[11px] font-medium text-brand">
                      Free
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={goToStep2}
                  className="flex w-full items-center justify-center gap-2 rounded-[8px] bg-brand py-2.5 text-sm font-medium text-white transition-colors hover:bg-brand-dark"
                >
                  Próximo
                </button>
              </>
            ) : (
              <>
                <div>
                  <label htmlFor="name" className="mb-1.5 block text-[13px] font-medium text-neutral-900">
                    Nome completo
                  </label>
                  <div className="relative">
                    <User className="pointer-events-none absolute left-3 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-neutral-400" />
                    <input
                      id="name"
                      type="text"
                      autoComplete="name"
                      placeholder="Seu nome completo"
                      aria-invalid={!!errors.director?.name}
                      className="w-full rounded-[12px] border-[1.5px] border-neutral-200 bg-white py-2.5 pl-10 pr-3 text-[15px] text-neutral-900 outline-none transition-colors placeholder:text-neutral-400 focus:border-brand"
                      {...register('director.name')}
                    />
                  </div>
                  {errors.director?.name && (
                    <p className="mt-1 text-[12px] text-danger">{errors.director.name.message}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="email" className="mb-1.5 block text-[13px] font-medium text-neutral-900">
                    Email
                  </label>
                  <div className="relative">
                    <Mail className="pointer-events-none absolute left-3 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-neutral-400" />
                    <input
                      id="email"
                      type="email"
                      autoComplete="email"
                      placeholder="voce@imobiliaria.com"
                      aria-invalid={!!errors.director?.email}
                      className="w-full rounded-[12px] border-[1.5px] border-neutral-200 bg-white py-2.5 pl-10 pr-3 text-[15px] text-neutral-900 outline-none transition-colors placeholder:text-neutral-400 focus:border-brand"
                      {...register('director.email')}
                    />
                  </div>
                  {errors.director?.email && (
                    <p className="mt-1 text-[12px] text-danger">{errors.director.email.message}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="phone" className="mb-1.5 block text-[13px] font-medium text-neutral-900">
                    Telefone
                  </label>
                  <div className="relative">
                    <Phone className="pointer-events-none absolute left-3 top-1/2 z-10 h-[18px] w-[18px] -translate-y-1/2 text-neutral-400" />
                    <MaskedInput
                      control={control}
                      name="director.phone"
                      mask={phoneMask}
                      id="phone"
                      placeholder="(11) 99999-9999"
                      className="w-full rounded-[12px] border-[1.5px] border-neutral-200 bg-white py-2.5 pl-10 pr-3 text-[15px] text-neutral-900 outline-none transition-colors placeholder:text-neutral-400 focus:border-brand"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="password" className="mb-1.5 block text-[13px] font-medium text-neutral-900">
                    Senha
                  </label>
                  <div className="relative">
                    <Lock className="pointer-events-none absolute left-3 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-neutral-400" />
                    <input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="new-password"
                      placeholder="••••••••"
                      aria-invalid={!!errors.director?.password}
                      className="w-full rounded-[12px] border-[1.5px] border-neutral-200 bg-white py-2.5 pl-10 pr-10 text-[15px] text-neutral-900 outline-none transition-colors placeholder:text-neutral-400 focus:border-brand"
                      {...register('director.password')}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((prev) => !prev)}
                      aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
                    >
                      {showPassword ? <EyeOff className="h-[18px] w-[18px]" /> : <Eye className="h-[18px] w-[18px]" />}
                    </button>
                  </div>
                  {errors.director?.password && (
                    <p className="mt-1 text-[12px] text-danger">{errors.director.password.message}</p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="confirmPassword"
                    className="mb-1.5 block text-[13px] font-medium text-neutral-900"
                  >
                    Confirmar senha
                  </label>
                  <div className="relative">
                    <Lock className="pointer-events-none absolute left-3 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-neutral-400" />
                    <input
                      id="confirmPassword"
                      type={showConfirmPassword ? 'text' : 'password'}
                      autoComplete="new-password"
                      placeholder="••••••••"
                      aria-invalid={!!errors.director?.confirmPassword}
                      className="w-full rounded-[12px] border-[1.5px] border-neutral-200 bg-white py-2.5 pl-10 pr-10 text-[15px] text-neutral-900 outline-none transition-colors placeholder:text-neutral-400 focus:border-brand"
                      {...register('director.confirmPassword')}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword((prev) => !prev)}
                      aria-label={showConfirmPassword ? 'Ocultar senha' : 'Mostrar senha'}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="h-[18px] w-[18px]" />
                      ) : (
                        <Eye className="h-[18px] w-[18px]" />
                      )}
                    </button>
                  </div>
                  {errors.director?.confirmPassword && (
                    <p className="mt-1 text-[12px] text-danger">
                      {errors.director.confirmPassword.message}
                    </p>
                  )}
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setStep(0)}
                    className="rounded-[8px] border-[1.5px] border-neutral-200 px-4 py-2.5 text-sm font-medium text-neutral-600 transition-colors hover:bg-neutral-100"
                  >
                    Voltar
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex flex-1 items-center justify-center gap-2 rounded-[8px] bg-brand py-2.5 text-sm font-medium text-white transition-colors hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
                    Criar conta
                  </button>
                </div>
              </>
            )}
          </form>

          <div className="mt-4 text-center">
            <p className="text-sm text-neutral-400">
              Já tem conta?{' '}
              <Link href="/login" className="font-medium text-brand hover:text-brand-dark">
                Entrar
              </Link>
            </p>
          </div>
        </div>
      </div>
    </main>
  )
}
