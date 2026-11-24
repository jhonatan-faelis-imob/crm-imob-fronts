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
import { documentMask } from '@/features/assinatura/billing-info-fields'
import { isValidDocumentOrEmpty } from '@/features/assinatura/constants'
import { slugify, SLUG_PATTERN } from '@/lib/slugify'
import { LINKS } from '@/lib/landing/links'

const cadastroSchema = z.object({
  acceptedTerms: z.boolean().refine((value) => value, 'Aceite os Termos de Uso e a Política de Privacidade'),
  org: z.object({
    orgName: z.string().min(1, 'Informe o nome da imobiliária'),
    slug: z
      .string()
      .min(1, 'Informe o slug')
      .regex(SLUG_PATTERN, 'Use apenas letras minúsculas, números e hífens'),
    document: z
      .string()
      .min(1, 'Informe o CPF ou CNPJ')
      .refine(isValidDocumentOrEmpty, 'CPF ou CNPJ inválido'),
  }),
  director: z
    .object({
      name: z.string().min(1, 'Informe seu nome completo'),
      email: z.string().min(1, 'Informe seu email').email('Digite um email válido'),
      phone: z
        .string()
        .refine((value) => [10, 11].includes(value.replace(/\D/g, '').length), 'Informe o telefone com DDD'),
      password: z.string().min(8, 'A senha deve ter no mínimo 8 caracteres'),
      confirmPassword: z.string().min(1, 'Confirme sua senha'),
    })
    .refine((data) => data.password === data.confirmPassword, {
      message: 'As senhas não coincidem',
      path: ['confirmPassword'],
    }),
})

type CadastroFormValues = z.infer<typeof cadastroSchema>

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
    setError,
    control,
    formState: { errors, isSubmitting },
  } = useForm<CadastroFormValues>({
    resolver: zodResolver(cadastroSchema),
    defaultValues: {
      acceptedTerms: false,
      org: { orgName: '', slug: '', document: '' },
      director: { name: '', email: '', phone: '', password: '', confirmPassword: '' },
    },
  })

  const orgName = watch('org.orgName')
  const acceptedTerms = watch('acceptedTerms')

  useEffect(() => {
    if (!slugTouched) {
      setValue('org.slug', slugify(orgName ?? ''))
    }
  }, [orgName, slugTouched, setValue])

  async function goToStep2() {
    const isValid = await trigger(['org.orgName', 'org.slug', 'org.document'])
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
        phone: data.director.phone,
        document: data.org.document,
        password: data.director.password,
        acceptedTerms: data.acceptedTerms,
      })

      const auth = await authService.login(data.director.email, data.director.password)
      useAuthStore.getState().setAuth(auth.user, auth.accessToken, auth.refreshToken)
      router.push('/dashboard')
    } catch (error) {
      const message: unknown = axios.isAxiosError(error) ? error.response?.data?.message : null
      if (axios.isAxiosError(error) && error.response?.status === 409 && typeof message === 'string' && /documento/i.test(message)) {
        // Documento já usado: volta para o passo da imobiliária com a mensagem no campo
        setStep(0)
        setError('org.document', { message: 'Já existe uma conta com este CPF ou CNPJ. Entre com ela ou fale com o suporte.' })
      } else if (typeof message === 'string') {
        setSubmitError(message)
      } else {
        setSubmitError('Não foi possível criar a conta. Tente novamente.')
      }
    }
  }

  return (
    <main className="flex min-h-screen flex-col bg-canvas lg:flex-row">
      <div className="hidden bg-brand p-12 text-paper lg:flex lg:w-1/2 lg:flex-col">
        <span className="text-xl font-semibold">Smart CRM</span>

        <div className="flex flex-1 flex-col items-start justify-center">
          <h1 className="max-w-md text-[32px] font-semibold leading-tight">
            14 dias grátis, sem cartão de crédito
          </h1>
          <p className="mt-3 max-w-sm text-base text-paper/80">
            Cadastre sua imobiliária, monte sua equipe e centralize todo o funil de vendas em um só
            lugar.
          </p>
        </div>
      </div>

      <div className="flex flex-1 items-center justify-center p-4 sm:p-6 lg:w-1/2 lg:p-12">
        <div className="w-full max-w-sm rounded-[16px] border-[0.5px] border-line bg-paper p-8">
          <div className="mb-8 text-center text-xl font-semibold text-brand lg:hidden">
            CRM <span className="text-brand">Imob</span>
          </div>

          <div className="flex items-center gap-2">
            {STEPS.map((item, index) => (
              <div key={item.label} className="flex flex-1 items-center gap-2">
                <div
                  className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold transition-colors ${
                    index < step
                      ? 'bg-brand text-paper'
                      : index === step
                        ? 'bg-line text-brand ring-1 ring-brand'
                        : 'bg-canvas text-muted-foreground'
                  }`}
                >
                  {index < step ? <Check className="h-3.5 w-3.5" /> : index + 1}
                </div>
                <span
                  className={`text-xs font-medium ${
                    index <= step ? 'text-brand' : 'text-muted-foreground'
                  }`}
                >
                  {item.label}
                </span>
                {index < STEPS.length - 1 && (
                  <div
                    className={`h-px flex-1 ${index < step ? 'bg-brand' : 'bg-line'}`}
                  />
                )}
              </div>
            ))}
          </div>

          <h2 className="mt-6 text-[20px] font-semibold text-brand">
            {step === 0 ? 'Dados da imobiliária' : 'Dados do diretor'}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
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
                  <label htmlFor="orgName" className="mb-1.5 block text-[13px] font-medium text-brand">
                    Nome da imobiliária
                  </label>
                  <div className="relative">
                    <Building2 className="pointer-events-none absolute left-3 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-muted-foreground" />
                    <input
                      id="orgName"
                      type="text"
                      autoComplete="organization"
                      placeholder="Imobiliária Alpha"
                      aria-invalid={!!errors.org?.orgName}
                      className="w-full rounded-[12px] border-[1.5px] border-line bg-paper py-2.5 pl-10 pr-3 text-[15px] text-brand outline-none transition-colors placeholder:text-muted-foreground focus:border-brand"
                      {...register('org.orgName')}
                    />
                  </div>
                  {errors.org?.orgName && (
                    <p className="mt-1 text-[12px] text-danger">{errors.org.orgName.message}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="slug" className="mb-1.5 block text-[13px] font-medium text-brand">
                    Slug
                  </label>
                  <input
                    id="slug"
                    type="text"
                    placeholder="imobiliaria-alpha"
                    aria-invalid={!!errors.org?.slug}
                    className="w-full rounded-[12px] border-[1.5px] border-line bg-paper px-3 py-2.5 text-[15px] text-brand outline-none transition-colors placeholder:text-muted-foreground focus:border-brand"
                    {...register('org.slug', { onChange: () => setSlugTouched(true) })}
                  />
                  <p className="mt-1 text-[12px] text-muted-foreground">
                    Identifica sua imobiliária no sistema. Gerado automaticamente, mas você pode
                    editar.
                  </p>
                  {errors.org?.slug && (
                    <p className="mt-1 text-[12px] text-danger">{errors.org.slug.message}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="document" className="mb-1.5 block text-[13px] font-medium text-brand">
                    CPF ou CNPJ
                  </label>
                  <MaskedInput
                    control={control}
                    name="org.document"
                    mask={documentMask}
                    id="document"
                    placeholder="000.000.000-00"
                    className="w-full rounded-[12px] border-[1.5px] border-line bg-paper px-3 py-2.5 text-[15px] text-brand outline-none transition-colors placeholder:text-muted-foreground focus:border-brand"
                  />
                  {errors.org?.document && (
                    <p className="mt-1 text-[12px] text-danger">{errors.org.document.message}</p>
                  )}
                </div>

                <p className="rounded-[12px] bg-line px-3 py-2.5 text-center text-[13px] font-medium text-brand">
                  14 dias grátis, sem cartão de crédito
                </p>

                <button
                  type="button"
                  onClick={goToStep2}
                  className="flex w-full items-center justify-center gap-2 rounded-[8px] bg-brand py-2.5 text-sm font-medium text-paper transition-colors hover:bg-ink"
                >
                  Próximo
                </button>
              </>
            ) : (
              <>
                <div>
                  <label htmlFor="name" className="mb-1.5 block text-[13px] font-medium text-brand">
                    Nome completo
                  </label>
                  <div className="relative">
                    <User className="pointer-events-none absolute left-3 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-muted-foreground" />
                    <input
                      id="name"
                      type="text"
                      autoComplete="name"
                      placeholder="Seu nome completo"
                      aria-invalid={!!errors.director?.name}
                      className="w-full rounded-[12px] border-[1.5px] border-line bg-paper py-2.5 pl-10 pr-3 text-[15px] text-brand outline-none transition-colors placeholder:text-muted-foreground focus:border-brand"
                      {...register('director.name')}
                    />
                  </div>
                  {errors.director?.name && (
                    <p className="mt-1 text-[12px] text-danger">{errors.director.name.message}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="email" className="mb-1.5 block text-[13px] font-medium text-brand">
                    Email
                  </label>
                  <div className="relative">
                    <Mail className="pointer-events-none absolute left-3 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-muted-foreground" />
                    <input
                      id="email"
                      type="email"
                      autoComplete="email"
                      placeholder="voce@imobiliaria.com"
                      aria-invalid={!!errors.director?.email}
                      className="w-full rounded-[12px] border-[1.5px] border-line bg-paper py-2.5 pl-10 pr-3 text-[15px] text-brand outline-none transition-colors placeholder:text-muted-foreground focus:border-brand"
                      {...register('director.email')}
                    />
                  </div>
                  {errors.director?.email && (
                    <p className="mt-1 text-[12px] text-danger">{errors.director.email.message}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="phone" className="mb-1.5 block text-[13px] font-medium text-brand">
                    Telefone
                  </label>
                  <div className="relative">
                    <Phone className="pointer-events-none absolute left-3 top-1/2 z-10 h-[18px] w-[18px] -translate-y-1/2 text-muted-foreground" />
                    <MaskedInput
                      control={control}
                      name="director.phone"
                      mask={phoneMask}
                      id="phone"
                      placeholder="(11) 99999-9999"
                      className="w-full rounded-[12px] border-[1.5px] border-line bg-paper py-2.5 pl-10 pr-3 text-[15px] text-brand outline-none transition-colors placeholder:text-muted-foreground focus:border-brand"
                    />
                  </div>
                  {errors.director?.phone && (
                    <p className="mt-1 text-[12px] text-danger">{errors.director.phone.message}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="password" className="mb-1.5 block text-[13px] font-medium text-brand">
                    Senha
                  </label>
                  <div className="relative">
                    <Lock className="pointer-events-none absolute left-3 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-muted-foreground" />
                    <input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="new-password"
                      placeholder="••••••••"
                      aria-invalid={!!errors.director?.password}
                      className="w-full rounded-[12px] border-[1.5px] border-line bg-paper py-2.5 pl-10 pr-10 text-[15px] text-brand outline-none transition-colors placeholder:text-muted-foreground focus:border-brand"
                      {...register('director.password')}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((prev) => !prev)}
                      aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-muted-foreground"
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
                    className="mb-1.5 block text-[13px] font-medium text-brand"
                  >
                    Confirmar senha
                  </label>
                  <div className="relative">
                    <Lock className="pointer-events-none absolute left-3 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-muted-foreground" />
                    <input
                      id="confirmPassword"
                      type={showConfirmPassword ? 'text' : 'password'}
                      autoComplete="new-password"
                      placeholder="••••••••"
                      aria-invalid={!!errors.director?.confirmPassword}
                      className="w-full rounded-[12px] border-[1.5px] border-line bg-paper py-2.5 pl-10 pr-10 text-[15px] text-brand outline-none transition-colors placeholder:text-muted-foreground focus:border-brand"
                      {...register('director.confirmPassword')}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword((prev) => !prev)}
                      aria-label={showConfirmPassword ? 'Ocultar senha' : 'Mostrar senha'}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-muted-foreground"
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

                <div>
                  <label htmlFor="acceptedTerms" className="flex min-h-11 items-start gap-3 text-[13px] text-muted-foreground">
                    <input
                      id="acceptedTerms"
                      type="checkbox"
                      className="mt-0.5 size-5 shrink-0 accent-[#FF385C]"
                      {...register('acceptedTerms')}
                    />
                    <span>
                      Li e aceito os{' '}
                      <a href={LINKS.terms} target="_blank" rel="noopener noreferrer" className="font-medium text-brand hover:text-brand">
                        Termos de Uso
                      </a>{' '}
                      e a{' '}
                      <a href={LINKS.privacy} target="_blank" rel="noopener noreferrer" className="font-medium text-brand hover:text-brand">
                        Política de Privacidade
                      </a>
                    </span>
                  </label>
                  {errors.acceptedTerms && <p className="mt-1 text-[12px] text-danger">{errors.acceptedTerms.message}</p>}
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setStep(0)}
                    className="rounded-[8px] border-[1.5px] border-line px-4 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-canvas"
                  >
                    Voltar
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting || !acceptedTerms}
                    className="flex flex-1 items-center justify-center gap-2 rounded-[8px] bg-brand py-2.5 text-sm font-medium text-paper transition-colors hover:bg-ink disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
                    Criar conta
                  </button>
                </div>
              </>
            )}
          </form>

          <div className="mt-4 text-center">
            <p className="text-sm text-muted-foreground">
              Já tem conta?{' '}
              <Link href="/login" className="font-medium text-brand hover:text-brand">
                Entrar
              </Link>
            </p>
          </div>
        </div>
      </div>
    </main>
  )
}
