'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { useQuery } from '@tanstack/react-query'
import { Search, X } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import type { ApiProperty } from '@/features/empreendimentos/api'
import { leadsService } from '@/services/leads.service'
import { propertiesService } from '@/services/properties.service'
import type { CreateSaleDto } from '@/services/sales.service'
import type { Lead } from '@/types'
import { ddmmyyyyToIso, parseCurrency, type ApiLead } from '../api-mapper'
import { FieldGrid, FormField, inputClassName, inputWithIconClassName } from '../lead-form/field'
import { toCurrencyMaskValue } from '../lead-form/from-lead'
import { MaskedDateInput } from '../lead-form/masked-date-input'
import { MaskedInput } from '../lead-form/masked-input'
import { currencyMask } from '../lead-form/masks'

export type SaleLead = Pick<Lead, 'id' | 'name' | 'interestValue' | 'funnelStageId'>

type SaleProperty = Pick<ApiProperty, 'id' | 'title'>

function isRealDate(value: string) {
  const iso = ddmmyyyyToIso(value)
  if (!iso) return false
  const date = new Date(`${iso}T00:00:00Z`)
  return !Number.isNaN(date.getTime()) && date.toISOString().startsWith(iso)
}

const saleFormSchema = z.object({
  saleValue: z.string().refine((value) => (parseCurrency(value) ?? 0) > 0, 'Informe o valor da venda'),
  unitIdentifier: z.string().optional(),
  commissionPct: z
    .string()
    .optional()
    .refine((value) => !value || (Number(value) >= 0 && Number(value) <= 100), 'Informe um percentual entre 0 e 100'),
  soldAt: z.string().refine(isRealDate, 'Informe uma data válida'),
  notes: z.string().optional(),
})

type SaleFormValues = z.infer<typeof saleFormSchema>

function PropertyPicker({
  selected,
  onSelect,
}: {
  selected: SaleProperty | null | undefined
  onSelect: (property: SaleProperty | null) => void
}) {
  const [query, setQuery] = useState('')
  const [isListOpen, setIsListOpen] = useState(false)

  const { data, isLoading } = useQuery<{ data: ApiProperty[] }>({
    queryKey: ['properties', 'search', query],
    queryFn: () => propertiesService.findAll({ search: query, limit: '20' }),
    enabled: isListOpen,
  })
  const results = data?.data ?? []

  if (selected) {
    return (
      <div className="flex items-center justify-between gap-2 rounded-[12px] border-[1.5px] border-neutral-200 bg-white px-3 py-2.5">
        <span className="truncate text-[15px] text-neutral-900">{selected.title}</span>
        <button
          type="button"
          aria-label="Remover empreendimento"
          onClick={() => onSelect(null)}
          className="shrink-0 rounded-[8px] p-1 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-900"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    )
  }

  return (
    <div>
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
        <input
          id="sale-property"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          onFocus={() => setIsListOpen(true)}
          onBlur={() => setIsListOpen(false)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') event.preventDefault()
          }}
          autoComplete="off"
          placeholder="Buscar por nome ou cidade..."
          className={inputWithIconClassName}
        />
      </div>

      {isListOpen && (
        // preventDefault keeps focus on the input, so its blur doesn't close the list before the click lands
        <div
          onMouseDown={(event) => event.preventDefault()}
          className="mt-1 max-h-40 space-y-1 overflow-y-auto rounded-[12px] border-[0.5px] border-neutral-200 bg-white p-1"
        >
          {results.map((property) => (
            <button
              key={property.id}
              type="button"
              onClick={() => onSelect({ id: property.id, title: property.title })}
              className="flex w-full flex-col rounded-[8px] px-3 py-2 text-left hover:bg-neutral-100"
            >
              <span className="truncate text-sm font-medium text-neutral-900">{property.title}</span>
              <span className="truncate text-xs text-neutral-400">{property.city}</span>
            </button>
          ))}
          {results.length === 0 && (
            <p className="px-3 py-2 text-sm text-neutral-400">
              {isLoading ? 'Buscando...' : 'Nenhum imóvel encontrado.'}
            </p>
          )}
        </div>
      )}
    </div>
  )
}

function RegisterSaleForm({
  lead,
  onCancel,
  onConfirm,
  isSubmitting,
}: {
  lead: SaleLead
  onCancel: () => void
  onConfirm: (dto: CreateSaleDto) => void
  isSubmitting: boolean
}) {
  // undefined = o corretor ainda não mexeu no campo, então segue o imóvel vinculado ao lead
  const [propertyChoice, setPropertyChoice] = useState<SaleProperty | null | undefined>(undefined)

  // Só GET /leads/:id traz os imóveis vinculados — a listagem do Kanban não inclui
  const { data: apiLead } = useQuery<ApiLead>({
    queryKey: ['lead', lead.id],
    queryFn: () => leadsService.findById(lead.id),
  })
  const linkedProperty = apiLead?.properties?.find(({ property }) => property.active && !property.sold)?.property
  const property = propertyChoice === undefined ? linkedProperty : propertyChoice

  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<SaleFormValues>({
    resolver: zodResolver(saleFormSchema),
    defaultValues: {
      saleValue: toCurrencyMaskValue(lead.interestValue),
      unitIdentifier: '',
      commissionPct: '',
      soldAt: new Date().toLocaleDateString('pt-BR'),
      notes: '',
    },
  })

  function onSubmit(values: SaleFormValues) {
    onConfirm({
      leadId: lead.id,
      propertyId: property?.id,
      saleValue: parseCurrency(values.saleValue) ?? 0,
      unitIdentifier: values.unitIdentifier?.trim() || undefined,
      commissionPct: values.commissionPct ? Number(values.commissionPct) : undefined,
      soldAt: ddmmyyyyToIso(values.soldAt) ?? '',
      notes: values.notes?.trim() || undefined,
    })
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex min-h-0 flex-1 flex-col">
      <div className="flex-1 space-y-4 overflow-y-auto p-4 sm:p-6">
        <FieldGrid>
          <FormField label="Valor da venda" htmlFor="sale-value" required error={errors.saleValue?.message}>
            <MaskedInput id="sale-value" control={control} name="saleValue" mask={currencyMask} placeholder="R$ 0,00" />
          </FormField>

          <FormField label="Data da venda" htmlFor="sale-date" required error={errors.soldAt?.message}>
            <MaskedDateInput control={control} name="soldAt" id="sale-date" />
          </FormField>

          <FormField label="Empreendimento / imóvel" htmlFor="sale-property" fullWidth>
            <PropertyPicker selected={property} onSelect={setPropertyChoice} />
          </FormField>

          <FormField label="Unidade" htmlFor="sale-unit">
            <input
              id="sale-unit"
              placeholder="Apto 304 Torre A"
              className={inputClassName}
              {...register('unitIdentifier')}
            />
          </FormField>

          <FormField label="% de comissão" htmlFor="sale-commission" error={errors.commissionPct?.message}>
            <input
              id="sale-commission"
              type="number"
              inputMode="decimal"
              min={0}
              max={100}
              step="0.01"
              className={inputClassName}
              {...register('commissionPct')}
            />
          </FormField>

          <FormField label="Observações" htmlFor="sale-notes" fullWidth>
            <textarea id="sale-notes" rows={3} className={inputClassName} {...register('notes')} />
          </FormField>
        </FieldGrid>
      </div>

      <DialogFooter className="mx-0 mb-0 shrink-0 flex-row justify-end gap-2 rounded-b-2xl border-t-[0.5px] border-neutral-200 bg-white p-4 sm:p-6">
        <button
          type="button"
          onClick={onCancel}
          disabled={isSubmitting}
          className="rounded-[8px] border-[1.5px] border-neutral-200 px-4 py-2.5 text-sm font-medium text-neutral-600 hover:bg-neutral-100 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded-[8px] bg-brand px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isSubmitting ? 'Confirmando...' : 'Confirmar venda'}
        </button>
      </DialogFooter>
    </form>
  )
}

export function RegisterSaleModal({
  lead,
  progressLabel,
  onCancel,
  onConfirm,
  isSubmitting = false,
}: {
  lead: SaleLead | undefined
  progressLabel?: string
  onCancel: () => void
  onConfirm: (dto: CreateSaleDto) => void
  isSubmitting?: boolean
}) {
  return (
    <Dialog
      open={lead !== undefined}
      onOpenChange={(nextOpen: boolean) => {
        if (!nextOpen && !isSubmitting) onCancel()
      }}
    >
      <DialogContent className="grid-cols-none flex max-h-[90vh] w-[calc(100%-2rem)] max-w-lg flex-col gap-0 rounded-2xl border-[0.5px] border-neutral-200 bg-white p-0 ring-0 sm:max-w-lg">
        <DialogHeader className="shrink-0 gap-1 border-b-[0.5px] border-neutral-200 p-4 pr-12 sm:p-6 sm:pr-14">
          <DialogTitle>Registrar venda</DialogTitle>
          <DialogDescription>
            {lead?.name}
            {progressLabel && ` · ${progressLabel}`}
          </DialogDescription>
        </DialogHeader>

        {lead && (
          <RegisterSaleForm
            key={lead.id}
            lead={lead}
            onCancel={onCancel}
            onConfirm={onConfirm}
            isSubmitting={isSubmitting}
          />
        )}
      </DialogContent>
    </Dialog>
  )
}
