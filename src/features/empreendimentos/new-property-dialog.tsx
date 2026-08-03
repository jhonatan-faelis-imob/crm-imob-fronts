'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import {
  Controller,
  FormProvider,
  useForm,
  useFormContext,
  useWatch,
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
import { PROPERTY_TYPE_META, PROPERTY_TYPES, RESALE_STATUS_META, RESALE_STATUSES, type ResaleStatus } from './constants'
import { FieldGrid, FormField, inputClassName } from './property-form/field'
import { MaskedInput } from './property-form/masked-input'
import { cepMask, currencyMask } from './property-form/masks'
import { useAddressLookup } from './property-form/use-address-lookup'

// Native <select> reports '' (not undefined) until chosen, so optional enums must accept it
function optionalSelectEnum<T extends readonly [string, ...string[]]>(values: T) {
  return z.enum([...values, ''] as [T[number] | '', ...(T[number] | '')[]]).optional()
}

const detailsSchema = z.object({
  title: z.string().min(1, 'Informe o título do imóvel'),
  propertyType: optionalSelectEnum(PROPERTY_TYPES),
  city: z.string().min(1, 'Informe a cidade'),
  neighborhood: z.string().optional(),
  cep: z.string().optional(),
  address: z.string().optional(),
  number: z.string().optional(),
  complement: z.string().optional(),
  bedrooms: z.string().optional(),
  bathrooms: z.string().optional(),
  parkingSpots: z.string().optional(),
  areaM2: z.string().optional(),
  price: z.string().min(1, 'Informe o valor do imóvel'),
  minIncome: z.string().optional(),
  maxIncome: z.string().optional(),
  ownerId: z.string().optional(),
})

const statusSchema = z.object({
  status: z.enum(RESALE_STATUSES),
  saleDate: z.string().optional(),
  notes: z.string().optional(),
})

const propertyFormSchema = z.object({
  details: detailsSchema,
  status: statusSchema,
})

type PropertyFormValues = z.infer<typeof propertyFormSchema>

const defaultValues: DefaultValues<PropertyFormValues> = {
  details: {
    title: '',
    city: '',
    neighborhood: '',
    cep: '',
    address: '',
    number: '',
    complement: '',
    bedrooms: '',
    bathrooms: '',
    parkingSpots: '',
    areaM2: '',
    price: '',
    minIncome: '',
    maxIncome: '',
    ownerId: '',
  },
  status: {
    status: 'disponivel',
    saleDate: '',
    notes: '',
  },
}

function toCurrencyMaskValue(value: number | undefined) {
  if (value === undefined) return ''
  return `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

// propertyType/number/complement/saleDate/notes não existem no backend ainda — a edição
// sempre parte desses campos vazios, mesmo reabrindo um imóvel que já os tinha preenchido.
function propertyToFormValues(property: Property): DefaultValues<PropertyFormValues> {
  return {
    details: {
      title: property.title,
      city: property.city,
      neighborhood: property.neighborhood ?? '',
      cep: property.cep ?? '',
      address: property.address ?? '',
      bedrooms: property.bedrooms !== undefined ? String(property.bedrooms) : '',
      bathrooms: property.bathrooms !== undefined ? String(property.bathrooms) : '',
      parkingSpots: property.parkingSpots !== undefined ? String(property.parkingSpots) : '',
      areaM2: property.areaM2 !== undefined ? String(property.areaM2) : '',
      price: toCurrencyMaskValue(property.price),
      minIncome: toCurrencyMaskValue(property.minIncome),
      maxIncome: toCurrencyMaskValue(property.maxIncome),
      ownerId: property.ownerId,
    },
    status: {
      status: (property.status as ResaleStatus) ?? 'disponivel',
      saleDate: '',
      notes: '',
    },
  }
}

const DETAILS_FIELDS: FieldPath<PropertyFormValues>[] = [
  'details.title',
  'details.propertyType',
  'details.city',
  'details.neighborhood',
  'details.cep',
  'details.address',
  'details.number',
  'details.complement',
  'details.bedrooms',
  'details.bathrooms',
  'details.parkingSpots',
  'details.areaM2',
  'details.price',
  'details.minIncome',
  'details.maxIncome',
  'details.ownerId',
]

const TABS = [
  { key: 'details', label: 'Dados do imóvel' },
  { key: 'status', label: 'Detalhes' },
] as const

function TabDetails({ brokers }: { brokers: { id: string; name: string }[] }) {
  const {
    register,
    control,
    getValues,
    setValue,
    formState: { errors },
  } = useFormContext<PropertyFormValues>()
  const { lookup, isLoading, error: cepError } = useAddressLookup()
  const detailsErrors = errors.details

  async function handleAutoComplete() {
    const result = await lookup(getValues('details.cep') ?? '')
    if (!result) return
    setValue('details.address', result.street, { shouldValidate: true, shouldDirty: true })
    setValue('details.neighborhood', result.neighborhood, { shouldValidate: true, shouldDirty: true })
    setValue('details.city', result.city, { shouldValidate: true, shouldDirty: true })
  }

  return (
    <FieldGrid>
      <FormField label="Título do imóvel" htmlFor="prop-title" required error={detailsErrors?.title?.message} fullWidth>
        <input id="prop-title" className={inputClassName} {...register('details.title')} />
      </FormField>

      <FormField label="Tipo" htmlFor="prop-type">
        <select id="prop-type" defaultValue="" className={inputClassName} {...register('details.propertyType')}>
          <option value="" disabled>
            Selecione
          </option>
          {PROPERTY_TYPES.map((type) => (
            <option key={type} value={type}>
              {PROPERTY_TYPE_META[type]}
            </option>
          ))}
        </select>
      </FormField>

      <FormField label="Cidade" htmlFor="prop-city" required error={detailsErrors?.city?.message}>
        <input id="prop-city" className={inputClassName} {...register('details.city')} />
      </FormField>

      <FormField label="Bairro" htmlFor="prop-neighborhood">
        <input id="prop-neighborhood" className={inputClassName} {...register('details.neighborhood')} />
      </FormField>

      <FormField label="CEP" htmlFor="prop-cep" error={cepError ?? undefined}>
        <div className="flex gap-2">
          <MaskedInput id="prop-cep" control={control} name="details.cep" mask={cepMask} placeholder="00000-000" />
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

      <FormField label="Endereço" htmlFor="prop-address">
        <input id="prop-address" className={inputClassName} {...register('details.address')} />
      </FormField>

      <FormField label="Número" htmlFor="prop-number">
        <input id="prop-number" className={inputClassName} {...register('details.number')} />
      </FormField>

      <FormField label="Complemento" htmlFor="prop-complement" fullWidth>
        <input id="prop-complement" className={inputClassName} {...register('details.complement')} />
      </FormField>

      <FormField label="Quartos" htmlFor="prop-bedrooms">
        <input id="prop-bedrooms" type="number" min="0" className={inputClassName} {...register('details.bedrooms')} />
      </FormField>

      <FormField label="Banheiros" htmlFor="prop-bathrooms">
        <input
          id="prop-bathrooms"
          type="number"
          min="0"
          className={inputClassName}
          {...register('details.bathrooms')}
        />
      </FormField>

      <FormField label="Vagas" htmlFor="prop-parkingSpots">
        <input
          id="prop-parkingSpots"
          type="number"
          min="0"
          className={inputClassName}
          {...register('details.parkingSpots')}
        />
      </FormField>

      <FormField label="Área m²" htmlFor="prop-areaM2">
        <input id="prop-areaM2" type="number" min="0" className={inputClassName} {...register('details.areaM2')} />
      </FormField>

      <FormField label="Valor" htmlFor="prop-price" required error={detailsErrors?.price?.message}>
        <MaskedInput
          id="prop-price"
          control={control}
          name="details.price"
          mask={currencyMask}
          placeholder="R$ 0,00"
        />
      </FormField>

      <FormField label="Renda mínima ideal" htmlFor="prop-minIncome">
        <MaskedInput
          id="prop-minIncome"
          control={control}
          name="details.minIncome"
          mask={currencyMask}
          placeholder="R$ 0,00"
        />
      </FormField>

      <FormField label="Renda máxima ideal" htmlFor="prop-maxIncome">
        <MaskedInput
          id="prop-maxIncome"
          control={control}
          name="details.maxIncome"
          mask={currencyMask}
          placeholder="R$ 0,00"
        />
      </FormField>

      <FormField label="Corretor responsável" htmlFor="prop-ownerId">
        <select id="prop-ownerId" defaultValue="" className={inputClassName} {...register('details.ownerId')}>
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
    </FieldGrid>
  )
}

function TabStatus() {
  const { register, control } = useFormContext<PropertyFormValues>()
  const status = useWatch({ control, name: 'status.status' })

  return (
    <FieldGrid>
      <FormField label="Status" htmlFor="prop-status">
        <select id="prop-status" className={inputClassName} {...register('status.status')}>
          {RESALE_STATUSES.map((value) => (
            <option key={value} value={value}>
              {RESALE_STATUS_META[value].label}
            </option>
          ))}
        </select>
      </FormField>

      {status === 'vendido' && (
        <FormField label="Data da venda" htmlFor="prop-saleDate">
          <Controller
            control={control}
            name="status.saleDate"
            render={({ field }) => (
              <input
                id="prop-saleDate"
                type="date"
                className={inputClassName}
                {...field}
                value={field.value ?? ''}
              />
            )}
          />
        </FormField>
      )}

      <FormField label="Observações" htmlFor="prop-notes" fullWidth>
        <textarea id="prop-notes" rows={3} className={inputClassName} {...register('status.notes')} />
      </FormField>
    </FieldGrid>
  )
}

export function NewPropertyDialog({
  open,
  onOpenChange,
  property,
  onSubmitProperty,
  brokers,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  property?: Property
  onSubmitProperty: (data: PropertyFormValues) => Promise<void>
  brokers: { id: string; name: string }[]
}) {
  const [activeTab, setActiveTab] = useState(0)
  const [isSaving, setIsSaving] = useState(false)
  const isEditing = property !== undefined

  const form = useForm<PropertyFormValues>({
    resolver: zodResolver(propertyFormSchema),
    defaultValues: property ? propertyToFormValues(property) : defaultValues,
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
      const isValid = await trigger(DETAILS_FIELDS)
      if (!isValid) return
    }
    setActiveTab(index)
  }

  async function onSubmit(data: PropertyFormValues) {
    try {
      setIsSaving(true)
      await onSubmitProperty(data)
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
            <DialogTitle>{isEditing ? 'Editar imóvel' : 'Novo imóvel (revenda)'}</DialogTitle>
            <DialogDescription>
              {isEditing ? 'Atualize os dados do imóvel.' : 'Cadastre um novo imóvel de revenda no portfólio.'}
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
            {activeTab === 0 && <TabDetails brokers={brokers} />}
            {activeTab === 1 && <TabStatus />}
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
              {isSaving ? 'Salvando...' : 'Salvar imóvel'}
            </button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
