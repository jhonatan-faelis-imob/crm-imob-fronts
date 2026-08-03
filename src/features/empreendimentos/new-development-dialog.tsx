'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import {
  Controller,
  FormProvider,
  useForm,
  useFormContext,
  type DefaultValues,
  type FieldPath,
} from 'react-hook-form'
import { z } from 'zod'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import type { Property } from '@/types'
import { DEVELOPMENT_STATUS_META, DEVELOPMENT_STATUSES, type DevelopmentStatus } from './constants'
import { FieldGrid, FormField, inputClassName } from './property-form/field'
import { MaskedInput } from './property-form/masked-input'
import { cepMask, currencyMask } from './property-form/masks'
import { useAddressLookup } from './property-form/use-address-lookup'

const generalSchema = z.object({
  title: z.string().min(1, 'Informe o nome do empreendimento'),
  city: z.string().min(1, 'Informe a cidade'),
  neighborhood: z.string().optional(),
  cep: z.string().optional(),
  address: z.string().optional(),
  totalUnits: z.string().optional(),
  startingPrice: z.string().optional(),
  maxPrice: z.string().optional(),
  minIncome: z.string().optional(),
  maxIncome: z.string().optional(),
  ownerId: z.string().optional(),
  description: z.string().optional(),
})

const settingsSchema = z.object({
  status: z.enum(DEVELOPMENT_STATUSES),
  launchDate: z.string().optional(),
  deliveryDate: z.string().optional(),
  internalNotes: z.string().optional(),
})

const developmentFormSchema = z.object({
  general: generalSchema,
  settings: settingsSchema,
})

type DevelopmentFormValues = z.infer<typeof developmentFormSchema>

const defaultValues: DefaultValues<DevelopmentFormValues> = {
  general: {
    title: '',
    city: '',
    neighborhood: '',
    cep: '',
    address: '',
    totalUnits: '',
    startingPrice: '',
    maxPrice: '',
    minIncome: '',
    maxIncome: '',
    ownerId: '',
    description: '',
  },
  settings: {
    status: 'lancamento',
    launchDate: '',
    deliveryDate: '',
    internalNotes: '',
  },
}

function toCurrencyMaskValue(value: number | undefined) {
  if (value === undefined) return ''
  return `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

// launchDate/deliveryDate/internalNotes não existem no backend ainda — a edição sempre
// parte desses campos vazios, mesmo reabrindo um empreendimento que já os tinha preenchido.
function developmentToFormValues(development: Property): DefaultValues<DevelopmentFormValues> {
  return {
    general: {
      title: development.title,
      city: development.city,
      neighborhood: development.neighborhood ?? '',
      cep: development.cep ?? '',
      address: development.address ?? '',
      totalUnits: development.totalUnits !== undefined ? String(development.totalUnits) : '',
      startingPrice: toCurrencyMaskValue(development.startingPrice),
      maxPrice: toCurrencyMaskValue(development.maxPrice),
      minIncome: toCurrencyMaskValue(development.minIncome),
      maxIncome: toCurrencyMaskValue(development.maxIncome),
      ownerId: development.ownerId,
      description: development.description ?? '',
    },
    settings: {
      status: (development.status as DevelopmentStatus) ?? 'lancamento',
      launchDate: '',
      deliveryDate: '',
      internalNotes: '',
    },
  }
}

const GENERAL_FIELDS: FieldPath<DevelopmentFormValues>[] = [
  'general.title',
  'general.city',
  'general.neighborhood',
  'general.cep',
  'general.address',
  'general.totalUnits',
  'general.startingPrice',
  'general.maxPrice',
  'general.minIncome',
  'general.maxIncome',
  'general.ownerId',
  'general.description',
]

const TABS = [
  { key: 'general', label: 'Dados gerais' },
  { key: 'settings', label: 'Configurações' },
] as const

function TabGeneral({ brokers }: { brokers: { id: string; name: string }[] }) {
  const {
    register,
    control,
    getValues,
    setValue,
    formState: { errors },
  } = useFormContext<DevelopmentFormValues>()
  const { lookup, isLoading, error: cepError } = useAddressLookup()
  const generalErrors = errors.general

  async function handleAutoComplete() {
    const result = await lookup(getValues('general.cep') ?? '')
    if (!result) return
    setValue('general.address', result.street, { shouldValidate: true, shouldDirty: true })
    setValue('general.neighborhood', result.neighborhood, { shouldValidate: true, shouldDirty: true })
    setValue('general.city', result.city, { shouldValidate: true, shouldDirty: true })
  }

  return (
    <FieldGrid>
      <FormField label="Nome do empreendimento" htmlFor="dev-title" required error={generalErrors?.title?.message} fullWidth>
        <input id="dev-title" className={inputClassName} {...register('general.title')} />
      </FormField>

      <FormField label="Cidade" htmlFor="dev-city" required error={generalErrors?.city?.message}>
        <input id="dev-city" className={inputClassName} {...register('general.city')} />
      </FormField>

      <FormField label="Bairro" htmlFor="dev-neighborhood">
        <input id="dev-neighborhood" className={inputClassName} {...register('general.neighborhood')} />
      </FormField>

      <FormField label="CEP" htmlFor="dev-cep" error={cepError ?? undefined}>
        <div className="flex gap-2">
          <MaskedInput id="dev-cep" control={control} name="general.cep" mask={cepMask} placeholder="00000-000" />
          <button
            type="button"
            onClick={handleAutoComplete}
            disabled={isLoading}
            className="shrink-0 rounded-[8px] border-[1.5px] border-neutral-200 px-3 text-sm font-medium text-neutral-600 transition-colors hover:border-brand hover:text-brand disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isLoading ? 'Buscando...' : 'Auto completar'}
          </button>
        </div>
      </FormField>

      <FormField label="Endereço" htmlFor="dev-address">
        <input id="dev-address" className={inputClassName} {...register('general.address')} />
      </FormField>

      <FormField label="Total de unidades" htmlFor="dev-totalUnits">
        <input
          id="dev-totalUnits"
          type="number"
          min="0"
          className={inputClassName}
          {...register('general.totalUnits')}
        />
      </FormField>

      <FormField label="Valor inicial" htmlFor="dev-startingPrice">
        <MaskedInput
          id="dev-startingPrice"
          control={control}
          name="general.startingPrice"
          mask={currencyMask}
          placeholder="R$ 0,00"
        />
      </FormField>

      <FormField label="Valor máximo" htmlFor="dev-maxPrice">
        <MaskedInput
          id="dev-maxPrice"
          control={control}
          name="general.maxPrice"
          mask={currencyMask}
          placeholder="R$ 0,00"
        />
      </FormField>

      <FormField label="Renda mínima ideal do cliente" htmlFor="dev-minIncome">
        <MaskedInput
          id="dev-minIncome"
          control={control}
          name="general.minIncome"
          mask={currencyMask}
          placeholder="R$ 0,00"
        />
      </FormField>

      <FormField label="Renda máxima ideal do cliente" htmlFor="dev-maxIncome">
        <MaskedInput
          id="dev-maxIncome"
          control={control}
          name="general.maxIncome"
          mask={currencyMask}
          placeholder="R$ 0,00"
        />
      </FormField>

      <FormField label="Corretor responsável" htmlFor="dev-ownerId" fullWidth>
        <select id="dev-ownerId" defaultValue="" className={inputClassName} {...register('general.ownerId')}>
          <option value="" disabled>
            Selecione o corretor
          </option>
          {brokers.map((broker) => (
            <option key={broker.id} value={broker.id}>
              {broker.name}
            </option>
          ))}
        </select>
      </FormField>

      <FormField label="Descrição" htmlFor="dev-description" fullWidth>
        <textarea id="dev-description" rows={3} className={inputClassName} {...register('general.description')} />
      </FormField>
    </FieldGrid>
  )
}

function TabSettings() {
  const { register, control } = useFormContext<DevelopmentFormValues>()

  return (
    <FieldGrid>
      <FormField label="Status" htmlFor="dev-status">
        <select id="dev-status" className={inputClassName} {...register('settings.status')}>
          {DEVELOPMENT_STATUSES.map((status) => (
            <option key={status} value={status}>
              {DEVELOPMENT_STATUS_META[status].label}
            </option>
          ))}
        </select>
      </FormField>

      <div />

      <FormField label="Data de lançamento" htmlFor="dev-launchDate">
        <Controller
          control={control}
          name="settings.launchDate"
          render={({ field }) => (
            <input id="dev-launchDate" type="date" className={inputClassName} {...field} value={field.value ?? ''} />
          )}
        />
      </FormField>

      <FormField label="Data prevista de entrega" htmlFor="dev-deliveryDate">
        <Controller
          control={control}
          name="settings.deliveryDate"
          render={({ field }) => (
            <input
              id="dev-deliveryDate"
              type="date"
              className={inputClassName}
              {...field}
              value={field.value ?? ''}
            />
          )}
        />
      </FormField>

      <FormField label="Observações internas" htmlFor="dev-internalNotes" fullWidth>
        <textarea
          id="dev-internalNotes"
          rows={3}
          className={inputClassName}
          {...register('settings.internalNotes')}
        />
      </FormField>
    </FieldGrid>
  )
}

export function NewDevelopmentDialog({
  open,
  onOpenChange,
  development,
  onSubmitDevelopment,
  brokers,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  development?: Property
  onSubmitDevelopment: (data: DevelopmentFormValues) => Promise<void>
  brokers: { id: string; name: string }[]
}) {
  const [activeTab, setActiveTab] = useState(0)
  const [isSaving, setIsSaving] = useState(false)
  const isEditing = development !== undefined

  const form = useForm<DevelopmentFormValues>({
    resolver: zodResolver(developmentFormSchema),
    defaultValues: development ? developmentToFormValues(development) : defaultValues,
  })
  const { handleSubmit, trigger, reset } = form

  function closeAndReset() {
    onOpenChange(false)
    reset(defaultValues)
    setActiveTab(0)
  }

  async function goToTab(index: number) {
    if (index === activeTab) return
    if (index > activeTab && activeTab === 0) {
      const isValid = await trigger(GENERAL_FIELDS)
      if (!isValid) return
    }
    setActiveTab(index)
  }

  async function onSubmit(data: DevelopmentFormValues) {
    try {
      setIsSaving(true)
      await onSubmitDevelopment(data)
      closeAndReset()
    } finally {
      setIsSaving(false)
    }
  }

  function onInvalid() {
    setActiveTab(0)
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen: boolean) => {
        if (!nextOpen) {
          closeAndReset()
          return
        }
        onOpenChange(nextOpen)
      }}
    >
      <DialogContent className="grid-cols-none flex w-[calc(100%-2rem)] max-w-2xl flex-col gap-0 rounded-2xl border-[0.5px] border-neutral-200 bg-white p-0 ring-0 sm:max-w-2xl max-h-[90vh]">
        <DialogHeader className="shrink-0 gap-3 border-b-[0.5px] border-neutral-200 p-4 pr-12 sm:p-6 sm:pr-14">
          <div>
            <DialogTitle>{isEditing ? 'Editar empreendimento' : 'Novo empreendimento'}</DialogTitle>
            <DialogDescription>
              {isEditing ? 'Atualize os dados do empreendimento.' : 'Cadastre um novo empreendimento no portfólio.'}
            </DialogDescription>
          </div>

          <div className="-mx-4 flex gap-1 overflow-x-auto px-4 sm:-mx-6 sm:px-6">
            {TABS.map((tab, index) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => goToTab(index)}
                className={`shrink-0 whitespace-nowrap border-b-2 px-3 py-2 text-sm font-medium transition-colors ${
                  activeTab === index
                    ? 'border-brand text-brand'
                    : 'border-transparent text-neutral-400 hover:text-neutral-600'
                }`}
              >
                {index + 1}. {tab.label}
              </button>
            ))}
          </div>
        </DialogHeader>

        <FormProvider {...form}>
          <form
            onSubmit={handleSubmit(onSubmit, onInvalid)}
            noValidate
            className="flex-1 overflow-y-auto p-4 sm:p-6"
          >
            {activeTab === 0 && <TabGeneral brokers={brokers} />}
            {activeTab === 1 && <TabSettings />}
          </form>
        </FormProvider>

        <DialogFooter className="mx-0 mb-0 shrink-0 flex-row justify-between gap-2 rounded-b-2xl border-t-[0.5px] border-neutral-200 bg-white p-4 sm:p-6">
          <button
            type="button"
            onClick={() => goToTab(activeTab - 1)}
            disabled={activeTab === 0}
            className="rounded-[8px] border-[1.5px] border-neutral-200 px-4 py-2.5 text-sm font-medium text-neutral-600 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Anterior
          </button>

          {activeTab < TABS.length - 1 ? (
            <button
              type="button"
              onClick={() => goToTab(activeTab + 1)}
              className="rounded-[8px] bg-brand px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-brand-dark"
            >
              Próximo
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit(onSubmit, onInvalid)}
              disabled={isSaving}
              className="rounded-[8px] bg-brand px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isSaving ? 'Salvando...' : 'Salvar empreendimento'}
            </button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
