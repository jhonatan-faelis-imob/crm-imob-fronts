'use client'

import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { isAxiosError } from 'axios'
import { AlertTriangle, ChevronDown, Copy, Info, MessageCircle, RotateCcw, Save, UserPlus } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { Switch } from '@/components/ui/switch'
import { toast } from '@/components/ui/toast'
import { parseCurrency } from '@/features/leads/api-mapper'
import { labelClassName } from '@/features/leads/lead-form/field'
import { toCurrencyMaskValue } from '@/features/leads/lead-form/from-lead'
import { MaskedInput } from '@/features/leads/lead-form/masked-input'
import { currencyMask } from '@/features/leads/lead-form/masks'
import { MessagePreviewDialog, type MessageDraft } from '@/features/mensagens/components/message-preview-dialog'
import { useDebouncedValue } from '@/lib/use-debounced-value'
import { cn, formatCurrency } from '@/lib/utils'
import { leadsService } from '@/services/leads.service'
import { messageTemplatesService } from '@/services/message-templates.service'
import { propertiesService } from '@/services/properties.service'
import {
  simulationsService,
  type SimulationParamsConfig,
  type SimulationProperty,
  type SimulationRequest,
} from '@/services/simulations.service'
import type { Lead } from '@/types'
import { useSimulationDraftStore } from '../simulation-draft-store'
import { simulationSummary } from '../summary'
import { SimulationProperties } from './simulation-properties'

const DEBOUNCE_MS = 400

type SimulatorLead = Pick<
  Lead,
  'id' | 'name' | 'phone' | 'phone2' | 'income' | 'spouseIncome' | 'fgtsValue' | 'ownResources' | 'hasClt3Years'
>

interface MoneyForm {
  income: string
  spouseIncome: string
  fgts: string
  ownResources: string
  subsidy: string
}

const PARAM_FIELDS: { key: keyof SimulationParamsConfig; label: string; suffix: string; hint: string }[] = [
  { key: 'commitmentPct', label: '% da renda na parcela', suffix: '%', hint: 'Quanto da renda pode ir para a parcela' },
  { key: 'termFactor', label: 'Fator de prazo', suffix: '×', hint: 'Financiamento = parcela × fator' },
  { key: 'financingPct', label: '% financiado', suffix: '%', hint: 'Parte máxima do imóvel que o banco financia' },
]

const secondaryButtonClassName =
  'inline-flex h-11 items-center justify-center gap-2 rounded-[8px] border-[0.5px] border-neutral-200 bg-white px-4 text-sm font-medium text-neutral-600 transition-colors hover:bg-neutral-100 disabled:cursor-not-allowed disabled:opacity-60 sm:h-10'
const smallInputClassName =
  'w-full rounded-[12px] border-[1.5px] border-neutral-200 bg-white px-3 py-2.5 text-base text-neutral-900 outline-none focus:border-brand sm:text-sm'

function apiMessage(error: unknown) {
  const message = isAxiosError(error) ? error.response?.data?.message : undefined
  return typeof message === 'string' ? message : undefined
}

function ResultCard({ label, value, hint, strong }: { label: string; value: string; hint?: string; strong?: boolean }) {
  return (
    <div className={cn('rounded-[16px] border-[0.5px] border-neutral-200 bg-white p-4', strong && 'border-brand')}>
      <p className="text-xs text-neutral-400">{label}</p>
      <p className={cn('mt-1 text-xl font-semibold', strong ? 'text-brand' : 'text-neutral-900')}>{value}</p>
      {hint && <p className="mt-1 text-xs text-neutral-400">{hint}</p>}
    </div>
  )
}

export function Simulator({
  lead,
  linkedPropertyIds = [],
  variant = 'page',
}: {
  lead?: SimulatorLead
  linkedPropertyIds?: string[]
  // page: barra fixa acima da navegação do celular; sheet: no rodapé do Sheet
  variant?: 'page' | 'sheet'
}) {
  const router = useRouter()
  const queryClient = useQueryClient()
  const setDraft = useSimulationDraftStore((state) => state.setDraft)

  const { control } = useForm<MoneyForm>({
    defaultValues: {
      income: toCurrencyMaskValue(lead?.income),
      spouseIncome: toCurrencyMaskValue(lead?.spouseIncome),
      fgts: toCurrencyMaskValue(lead?.fgtsValue),
      ownResources: toCurrencyMaskValue(lead?.ownResources),
      subsidy: '',
    },
  })
  const money = useWatch({ control })
  const [sumSpouse, setSumSpouse] = useState(false)
  const [useFgts, setUseFgts] = useState(true)
  const [showAdvanced, setShowAdvanced] = useState(false)
  // null = padrão do servidor; só os alterados vão na requisição
  const [paramOverrides, setParamOverrides] = useState<Partial<Record<keyof SimulationParamsConfig, string>>>({})
  const [linkedIds, setLinkedIds] = useState(() => new Set(linkedPropertyIds))
  const [message, setMessage] = useState<{ draft: MessageDraft; session: number } | null>(null)
  const [isPreviewOpen, setIsPreviewOpen] = useState(false)

  const { data: config } = useQuery({
    queryKey: ['simulation-config'],
    queryFn: simulationsService.getConfig,
    staleTime: Infinity,
    meta: { silent: true },
  })

  const income = parseCurrency(money.income) ?? 0
  const spouseIncome = sumSpouse ? (parseCurrency(money.spouseIncome) ?? 0) : 0

  const paramErrors: Partial<Record<keyof SimulationParamsConfig, string>> = {}
  const params: Partial<SimulationParamsConfig> = {}
  for (const field of PARAM_FIELDS) {
    const raw = paramOverrides[field.key]
    if (raw === undefined) continue
    const value = Number(raw.replace(',', '.'))
    const limit = config?.limits[field.key]
    if (raw.trim() === '' || !Number.isFinite(value) || (limit && (value < limit.min || value > limit.max))) {
      paramErrors[field.key] = limit ? `Entre ${limit.min} e ${limit.max}` : 'Valor inválido'
    } else {
      params[field.key] = value
    }
  }
  const hasParamErrors = Object.keys(paramErrors).length > 0

  const request: SimulationRequest = {
    income,
    ...(spouseIncome > 0 && { spouseIncome }),
    fgts: parseCurrency(money.fgts) ?? 0,
    ownResources: parseCurrency(money.ownResources) ?? 0,
    subsidy: parseCurrency(money.subsidy) ?? 0,
    useFgts,
    ...(lead && { hasClt3Years: lead.hasClt3Years }),
    ...params,
    includeProperties: true,
  }
  // Debounce de uma string: um objeto novo a cada render reiniciaria o timer sem parar
  const requestKey = useDebouncedValue(JSON.stringify(request), DEBOUNCE_MS)
  const isTyping = requestKey !== JSON.stringify(request)

  const simulation = useQuery({
    queryKey: ['simulation', requestKey],
    queryFn: () => simulationsService.calculate(JSON.parse(requestKey) as SimulationRequest),
    enabled: (JSON.parse(requestKey) as SimulationRequest).income > 0 && !hasParamErrors,
    placeholderData: keepPreviousData,
    staleTime: 60_000,
    // Recalcula enquanto digita: não pode acionar o loading global
    meta: { silent: true },
  })
  const result = income > 0 ? simulation.data : undefined

  function invalidateLead() {
    if (!lead) return
    for (const queryKey of [['lead', lead.id], ['leads'], ['properties']]) queryClient.invalidateQueries({ queryKey })
  }

  // Renda do cônjuge nunca entra no income salvo
  const savedValues = {
    income: parseCurrency(money.income),
    fgtsValue: parseCurrency(money.fgts),
    ownResources: parseCurrency(money.ownResources),
  }
  const hasChanges =
    !!lead &&
    (savedValues.income !== lead.income ||
      savedValues.fgtsValue !== lead.fgtsValue ||
      savedValues.ownResources !== lead.ownResources)

  const saveToLead = useMutation({
    mutationFn: () => {
      if (!lead) throw new Error('Sem lead')
      return leadsService.update(lead.id, savedValues)
    },
    onSuccess: () => {
      invalidateLead()
      toast.add({ title: 'Cadastro atualizado com os valores da simulação', type: 'success' })
    },
    onError: (error) => toast.add({ title: 'Não foi possível salvar', description: apiMessage(error), type: 'error' }),
  })

  const linkProperty = useMutation({
    mutationFn: (property: SimulationProperty) => {
      if (!lead) throw new Error('Sem lead')
      return propertiesService.linkLead(property.id, lead.id)
    },
    onSuccess: (_data, property) => {
      setLinkedIds((current) => new Set(current).add(property.id))
      invalidateLead()
      toast.add({ title: `${property.title} vinculado ao lead`, type: 'success' })
    },
    onError: (error, property) => {
      if (isAxiosError(error) && error.response?.status === 409) {
        setLinkedIds((current) => new Set(current).add(property.id))
        toast.add({ title: 'Imóvel já vinculado a este lead', type: 'warning' })
        return
      }
      toast.add({ title: 'Não foi possível vincular o imóvel', description: apiMessage(error), type: 'error' })
    },
  })

  const prepareMessage = useMutation({
    mutationFn: (text: string) => {
      if (!lead) throw new Error('Sem lead')
      return messageTemplatesService.renderFree(lead.id, text)
    },
    onSuccess: ({ text }) => {
      setMessage((current) => ({
        draft: { templateId: null, templateName: 'Resumo da simulação', text },
        session: (current?.session ?? 0) + 1,
      }))
      setIsPreviewOpen(true)
    },
    onError: () => toast.add({ title: 'Não foi possível preparar a mensagem', type: 'error' }),
  })

  async function copySummary() {
    if (!result) return
    try {
      // Com lead, preenche saudação e nome; copiar não registra interação
      const text = lead
        ? (await messageTemplatesService.renderFree(lead.id, simulationSummary(result, true))).text
        : simulationSummary(result, false)
      await navigator.clipboard.writeText(text)
      toast.add({ title: 'Resumo copiado', type: 'success' })
    } catch {
      toast.add({ title: 'Não foi possível copiar o resumo', type: 'error' })
    }
  }

  function registerAsLead() {
    setDraft(savedValues)
    router.push('/leads')
  }

  const paramValue = (key: keyof SimulationParamsConfig) =>
    paramOverrides[key] ?? (config ? String(config.defaults[key]) : '')

  const surplusHint =
    result && result.downPayment.surplus > 0
      ? `Sobra de ${formatCurrency(result.downPayment.surplus)}: com ela, imóveis de até ${formatCurrency(result.maxPurchaseValue)}`
      : undefined

  return (
    <div className={cn('space-y-4', variant === 'page' && 'pb-20 lg:pb-0')}>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
        {/* ---------- Entradas ---------- */}
        <section className="space-y-4 rounded-[16px] border-[0.5px] border-neutral-200 bg-white p-4 sm:p-5">
          <div>
            <label htmlFor="sim-income" className={labelClassName}>
              Renda mensal
            </label>
            <MaskedInput control={control} name="income" mask={currencyMask} id="sim-income" placeholder="R$ 0,00" />
            <p className="mt-1 text-xs text-neutral-400">Use a renda que será comprovada</p>
          </div>

          <div className="rounded-[12px] bg-neutral-100 p-3">
            <label className="flex min-h-11 items-center justify-between gap-3 text-sm text-neutral-900">
              Somar renda do cônjuge
              <Switch checked={sumSpouse} onCheckedChange={setSumSpouse} aria-label="Somar renda do cônjuge" />
            </label>
            {sumSpouse && (
              <div className="mt-2">
                <MaskedInput control={control} name="spouseIncome" mask={currencyMask} placeholder="R$ 0,00" />
                {result && result.inputs.spouseIncome > 0 && (
                  <p className="mt-1 text-xs text-neutral-600">
                    Renda total: <strong>{formatCurrency(result.inputs.totalIncome)}</strong>
                  </p>
                )}
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
            <div>
              <label htmlFor="sim-fgts" className={labelClassName}>
                FGTS
              </label>
              <MaskedInput control={control} name="fgts" mask={currencyMask} id="sim-fgts" placeholder="R$ 0,00" />
            </div>
            <div>
              <label htmlFor="sim-own" className={labelClassName}>
                Recursos próprios
              </label>
              <MaskedInput control={control} name="ownResources" mask={currencyMask} id="sim-own" placeholder="R$ 0,00" />
            </div>
            <div className="sm:col-span-2 lg:col-span-1 xl:col-span-2">
              <label htmlFor="sim-subsidy" className={labelClassName}>
                Subsídio estimado <span className="font-normal text-neutral-400">(opcional)</span>
              </label>
              <MaskedInput control={control} name="subsidy" mask={currencyMask} id="sim-subsidy" placeholder="R$ 0,00" />
            </div>
          </div>

          <label className="flex min-h-11 items-center justify-between gap-3 text-sm text-neutral-900">
            Usar o saldo do FGTS
            <Switch checked={useFgts} onCheckedChange={setUseFgts} aria-label="Usar o saldo do FGTS" />
          </label>

          <div className="border-t-[0.5px] border-neutral-200 pt-2">
            <button
              type="button"
              onClick={() => setShowAdvanced((open) => !open)}
              aria-expanded={showAdvanced}
              className="flex min-h-11 w-full items-center justify-between text-sm font-medium text-neutral-600"
            >
              Ajustes avançados
              <ChevronDown className={cn('h-4 w-4 transition-transform', showAdvanced && 'rotate-180')} />
            </button>
            {showAdvanced && (
              <div className="space-y-3 pt-1">
                {PARAM_FIELDS.map((field) => (
                  <div key={field.key}>
                    <label htmlFor={`sim-${field.key}`} className={labelClassName}>
                      {field.label}
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        id={`sim-${field.key}`}
                        inputMode="decimal"
                        value={paramValue(field.key)}
                        onChange={(event) =>
                          setParamOverrides((current) => ({ ...current, [field.key]: event.target.value }))
                        }
                        className={smallInputClassName}
                      />
                      <span className="w-4 text-sm text-neutral-400">{field.suffix}</span>
                    </div>
                    <p className={cn('mt-1 text-xs', paramErrors[field.key] ? 'text-danger' : 'text-neutral-400')}>
                      {paramErrors[field.key] ?? field.hint}
                    </p>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => setParamOverrides({})}
                  disabled={Object.keys(paramOverrides).length === 0}
                  className={secondaryButtonClassName}
                >
                  <RotateCcw className="h-4 w-4" />
                  Restaurar padrão
                </button>
              </div>
            )}
          </div>
        </section>

        {/* ---------- Resultado ---------- */}
        <div className={cn('space-y-4 transition-opacity', isTyping && result && 'opacity-70')}>
          {!result ? (
            <div className="flex min-h-40 items-center justify-center rounded-[16px] border-[0.5px] border-dashed border-neutral-200 bg-white p-6 text-center text-sm text-neutral-400">
              {simulation.isError && income > 0
                ? (apiMessage(simulation.error) ?? 'Não foi possível calcular a simulação.')
                : 'Informe a renda para ver a simulação.'}
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <ResultCard label="Parcela estimada" value={formatCurrency(result.installment)} />
                <ResultCard label="Financiamento estimado" value={formatCurrency(result.financing)} />
                <ResultCard
                  label={`Imóvel de referência (até ${formatCurrency(result.maxPurchaseValue)})`}
                  value={formatCurrency(result.referenceValue)}
                  hint={surplusHint}
                  strong
                />
                <div className="rounded-[16px] border-[0.5px] border-neutral-200 bg-white p-4">
                  <p className="text-xs text-neutral-400">Entrada</p>
                  <p className="mt-1 text-xl font-semibold text-neutral-900">{formatCurrency(result.downPayment.total)}</p>
                  <dl className="mt-2 space-y-1 text-xs text-neutral-600">
                    {[
                      ['FGTS', result.downPayment.fgts],
                      ['Recursos próprios', result.downPayment.ownResources],
                      ['Subsídio', result.downPayment.subsidy],
                    ].map(([label, value]) => (
                      <div key={label} className="flex justify-between gap-2">
                        <dt>{label}</dt>
                        <dd>{formatCurrency(Number(value))}</dd>
                      </div>
                    ))}
                    <div className="flex justify-between gap-2 border-t-[0.5px] border-neutral-200 pt-1 font-semibold text-neutral-900">
                      <dt>A complementar</dt>
                      <dd>{formatCurrency(result.downPayment.remaining)}</dd>
                    </div>
                  </dl>
                </div>
              </div>

              {result.warnings.map((warning) => (
                <p
                  key={warning.code}
                  className="flex items-start gap-2 rounded-[12px] bg-[#FFF7E0] p-3 text-sm text-[#B45309]"
                >
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                  {warning.message}
                </p>
              ))}

              <SimulationProperties
                items={result.properties.items}
                counts={result.properties.counts}
                canLink={!!lead}
                linkedIds={linkedIds}
                linkingId={linkProperty.isPending ? (linkProperty.variables?.id ?? null) : null}
                onLink={(property) => linkProperty.mutate(property)}
              />

              <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                {lead ? (
                  <>
                    <button
                      type="button"
                      onClick={() => prepareMessage.mutate(simulationSummary(result, true))}
                      disabled={prepareMessage.isPending}
                      className="inline-flex h-11 items-center justify-center gap-2 rounded-[8px] bg-[#25D366] px-4 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-60 sm:h-10"
                    >
                      <MessageCircle className="h-4 w-4" />
                      Enviar resumo no WhatsApp
                    </button>
                    {hasChanges && (
                      <button
                        type="button"
                        onClick={() => saveToLead.mutate()}
                        disabled={saveToLead.isPending}
                        className={secondaryButtonClassName}
                      >
                        <Save className="h-4 w-4" />
                        Salvar no cadastro
                      </button>
                    )}
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={registerAsLead}
                    className="inline-flex h-11 items-center justify-center gap-2 rounded-[8px] bg-brand px-4 text-sm font-medium text-white transition-colors hover:bg-brand-dark sm:h-10"
                  >
                    <UserPlus className="h-4 w-4" />
                    Cadastrar como lead
                  </button>
                )}
                <button type="button" onClick={copySummary} className={secondaryButtonClassName}>
                  <Copy className="h-4 w-4" />
                  Copiar resumo
                </button>
              </div>
            </>
          )}

          <p className="flex items-start gap-2 text-xs text-neutral-400">
            <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            Estimativa para atendimento. Não é aprovação de crédito: valores, prazo, juros e subsídio dependem da
            análise do banco.
          </p>
        </div>
      </div>

      {/* Celular: o resultado fica à vista enquanto digita */}
      {result && (
        <div
          className={cn(
            'z-40 rounded-[12px] border-[0.5px] border-neutral-200 bg-white px-4 py-3 text-sm font-semibold text-neutral-900 shadow-md lg:hidden',
            variant === 'page'
              ? 'fixed inset-x-4 bottom-[calc(4.5rem+env(safe-area-inset-bottom))]'
              : 'sticky bottom-0',
          )}
        >
          Até {formatCurrency(result.maxPurchaseValue)} · Parcela {formatCurrency(result.installment)}
        </div>
      )}

      {lead && message && (
        <MessagePreviewDialog
          key={message.session}
          open={isPreviewOpen}
          onOpenChange={setIsPreviewOpen}
          lead={lead}
          draft={message.draft}
        />
      )}
    </div>
  )
}
