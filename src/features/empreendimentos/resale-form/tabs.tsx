'use client'

import { IMaskInput } from 'react-imask'
import { Controller, useFormContext, useWatch } from 'react-hook-form'
import { Switch } from '@/components/ui/switch'
import { RESALE_STATUS_META, RESALE_STATUSES } from '../constants'
import { FieldGrid, FormField, inputClassName } from '../property-form/field'
import { MaskedInput } from '../property-form/masked-input'
import { PropertyCodeField } from '../property-form/property-code-field'
import { cepMask, currencyMask } from '../property-form/masks'
import { useAddressLookup } from '../property-form/use-address-lookup'
import type { PortalConfig, PortalPropertyType, PortalReadiness, PortalReadinessKey } from '../portal/types'
import { AiDescribePanel } from './ai-describe-panel'
import { ChoiceGroup } from './choice-group'
import { FeaturesPicker } from './features-picker'
import { resaleAiRequest, type ResaleFormValues, type TriState } from './form'
import { ReadinessCard } from './readiness-card'
import { SellerLeadPicker } from './seller-lead-picker'

function Counter({ value, max }: { value: number; max: number }) {
  return (
    <span className={`text-xs tabular-nums ${value > max ? 'text-danger' : 'text-neutral-400'}`}>
      {value}/{max}
    </span>
  )
}

// ---------------- 1. Básico ----------------

export function TabBasic({
  config,
  brokers,
  isEditing,
  originalCode,
}: {
  config: PortalConfig | undefined
  brokers: { id: string; name: string }[]
  isEditing: boolean
  originalCode: string | null | undefined
}) {
  const { register, control, formState } = useFormContext<ResaleFormValues>()
  const title = useWatch({ control, name: 'title' })
  const publishToPortals = useWatch({ control, name: 'publishToPortals' })
  const { errors } = formState
  const limits = config?.limits

  return (
    <FieldGrid>
      <FormField label="Tipo" htmlFor="prop-type" required>
        <select id="prop-type" className={inputClassName} {...register('propertyType')}>
          <option value="">Selecione</option>
          {config?.types.map((type) => (
            <option key={type.value} value={type.value}>
              {type.label}
              {type.vrsync === null ? ' (não vai para os portais)' : ''}
            </option>
          ))}
        </select>
      </FormField>

      <Controller
        control={control}
        name="code"
        render={({ field }) => (
          <PropertyCodeField
            id="prop-code"
            value={field.value}
            onChange={field.onChange}
            onBlur={field.onBlur}
            error={errors.code?.message}
            isEditing={isEditing}
            originalCode={originalCode}
            publishedToPortals={publishToPortals}
          />
        )}
      />

      <FormField label="Título" htmlFor="prop-title" required error={errors.title?.message} fullWidth>
        <input id="prop-title" maxLength={limits?.TITLE_MAX ?? 100} className={inputClassName} {...register('title')} />
        <div className="mt-1 flex items-center justify-between gap-2">
          <span className="text-xs text-neutral-400">
            {limits ? `${limits.TITLE_MIN} a ${limits.TITLE_MAX} caracteres para os portais` : ''}
          </span>
          <Counter value={title.length} max={limits?.TITLE_MAX ?? 100} />
        </div>
      </FormField>

      <FormField label="Valor" htmlFor="prop-price" required>
        <MaskedInput id="prop-price" control={control} name="price" mask={currencyMask} placeholder="R$ 0,00" />
      </FormField>

      <FormField label="Status" htmlFor="prop-status">
        <select id="prop-status" className={inputClassName} {...register('status')}>
          {RESALE_STATUSES.map((value) => (
            <option key={value} value={value}>
              {RESALE_STATUS_META[value].label}
            </option>
          ))}
        </select>
      </FormField>

      <FormField label="Corretor responsável" htmlFor="prop-ownerId">
        <select id="prop-ownerId" className={inputClassName} {...register('ownerId')}>
          <option value="">Eu mesmo</option>
          {brokers.map((broker) => (
            <option key={broker.id} value={broker.id}>
              {broker.name}
            </option>
          ))}
        </select>
      </FormField>

      <FormField label="Proprietário (opcional)" htmlFor="prop-seller" fullWidth>
        <SellerLeadPicker />
      </FormField>

      <FormField label="Renda mínima ideal" htmlFor="prop-minIncome">
        <MaskedInput id="prop-minIncome" control={control} name="minIncome" mask={currencyMask} placeholder="R$ 0,00" />
      </FormField>

      <FormField label="Renda máxima ideal" htmlFor="prop-maxIncome">
        <MaskedInput id="prop-maxIncome" control={control} name="maxIncome" mask={currencyMask} placeholder="R$ 0,00" />
      </FormField>
    </FieldGrid>
  )
}

// ---------------- 2. Endereço ----------------

const ADDRESS_DISPLAY_OPTIONS: { value: ResaleFormValues['portalAddressDisplay']; label: string }[] = [
  { value: 'full', label: 'Completo' },
  { value: 'street', label: 'Só a rua' },
  { value: 'neighborhood', label: 'Só o bairro' },
]

export function TabAddress() {
  const { register, control, setValue, getValues, formState } = useFormContext<ResaleFormValues>()
  const requireNeighborhood = useWatch({ control, name: 'requireNeighborhood' })
  const { lookup, isLoading, error: cepError } = useAddressLookup()
  const { errors } = formState

  async function fillFromCep(cep: string) {
    const result = await lookup(cep)
    if (!result) return
    const options = { shouldDirty: true, shouldValidate: true }
    if (result.street) setValue('address', result.street, options)
    setValue('neighborhood', result.neighborhood, options)
    setValue('city', result.city, options)
    setValue('state', result.state, options)
    // CEP geral (cidade pequena) vem sem bairro: o campo fica editável e obrigatório
    setValue('requireNeighborhood', result.neighborhood.trim() === '')
  }

  return (
    <div className="space-y-6">
      <FieldGrid>
        <FormField label="CEP" htmlFor="prop-cep" error={cepError ?? undefined}>
          <div className="flex gap-2">
            <Controller
              control={control}
              name="cep"
              render={({ field }) => (
                <IMaskInput
                  {...cepMask}
                  id="prop-cep"
                  inputMode="numeric"
                  placeholder="00000-000"
                  className={inputClassName}
                  value={field.value}
                  unmask={false}
                  inputRef={field.ref}
                  onBlur={field.onBlur}
                  onAccept={(value: string) => {
                    const changed = value !== field.value
                    field.onChange(value)
                    if (changed && value.replace(/\D/g, '').length === 8) void fillFromCep(value)
                  }}
                />
              )}
            />
            <button
              type="button"
              onClick={() => void fillFromCep(getValues('cep'))}
              disabled={isLoading}
              className="min-h-11 shrink-0 rounded-[8px] border-[1.5px] border-neutral-200 px-3 text-sm font-medium text-neutral-600 transition-colors hover:border-brand hover:text-brand disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isLoading ? 'Buscando…' : 'Buscar'}
            </button>
          </div>
        </FormField>

        <FormField label="Rua" htmlFor="prop-address">
          <input id="prop-address" className={inputClassName} {...register('address')} />
        </FormField>

        <FormField label="Número" htmlFor="prop-streetNumber" error={errors.streetNumber?.message}>
          <input id="prop-streetNumber" maxLength={20} className={inputClassName} {...register('streetNumber')} />
        </FormField>

        <FormField label="Complemento" htmlFor="prop-complement" error={errors.complement?.message}>
          <input id="prop-complement" maxLength={100} className={inputClassName} {...register('complement')} />
        </FormField>

        <FormField label="Bairro" htmlFor="prop-neighborhood" required={requireNeighborhood}>
          <input id="prop-neighborhood" className={inputClassName} {...register('neighborhood')} />
          {requireNeighborhood && <p className="mt-1 text-xs text-neutral-400">O CEP não trouxe o bairro: preencha.</p>}
        </FormField>

        <FormField label="Cidade" htmlFor="prop-city" required>
          <input id="prop-city" className={inputClassName} {...register('city')} />
        </FormField>

        <FormField label="UF" htmlFor="prop-state" error={errors.state?.message}>
          <input
            id="prop-state"
            maxLength={2}
            autoCapitalize="characters"
            className={`${inputClassName} uppercase`}
            {...register('state', { setValueAs: (value: string) => value.toUpperCase() })}
          />
        </FormField>
      </FieldGrid>

      <div>
        <p className="mb-1.5 text-[13px] font-medium text-neutral-900">Como mostrar o endereço nos portais</p>
        <Controller
          control={control}
          name="portalAddressDisplay"
          render={({ field }) => (
            <ChoiceGroup
              name="address-display"
              label="Como mostrar o endereço nos portais"
              value={field.value}
              options={ADDRESS_DISPLAY_OPTIONS}
              onChange={field.onChange}
            />
          )}
        />
        <p className="mt-1.5 text-xs text-neutral-400">
          Os portais recebem sempre o endereço completo. Isto só controla o que o público vê.
        </p>
      </div>
    </div>
  )
}

// ---------------- 3. Características ----------------

export function TabFeatures({ config, type }: { config: PortalConfig | undefined; type: PortalPropertyType | undefined }) {
  const { register, control, formState } = useFormContext<ResaleFormValues>()
  const { errors } = formState
  const isLot = type?.area === 'lot'
  const showBedrooms = type?.bedrooms !== 'hidden'
  const showBathrooms = type?.bathrooms !== 'hidden'

  return (
    <div className="space-y-6">
      {!type && <p className="rounded-[12px] bg-neutral-100 p-3 text-sm text-neutral-600">Escolha o tipo na aba Básico para ver os campos certos.</p>}
      <FieldGrid>
        {isLot ? (
          <FormField label="Área total (m²)" htmlFor="prop-lotAreaM2">
            <input id="prop-lotAreaM2" inputMode="decimal" className={inputClassName} {...register('lotAreaM2')} />
          </FormField>
        ) : (
          <FormField label="Área útil (m²)" htmlFor="prop-areaM2">
            <input id="prop-areaM2" inputMode="decimal" className={inputClassName} {...register('areaM2')} />
          </FormField>
        )}

        {showBedrooms && (
          <>
            <FormField label="Quartos" htmlFor="prop-bedrooms" required={type?.bedrooms === 'required'}>
              <input
                id="prop-bedrooms"
                type="number"
                min="0"
                inputMode="numeric"
                placeholder={type?.bedroomsDefault !== null && type?.bedroomsDefault !== undefined ? String(type.bedroomsDefault) : undefined}
                className={inputClassName}
                {...register('bedrooms')}
              />
            </FormField>
            <FormField label="Suítes" htmlFor="prop-suites">
              <input id="prop-suites" type="number" min="0" inputMode="numeric" className={inputClassName} {...register('suites')} />
            </FormField>
          </>
        )}

        {showBathrooms && (
          <FormField label="Banheiros" htmlFor="prop-bathrooms" required={type?.bathrooms === 'required'}>
            <input id="prop-bathrooms" type="number" min="0" inputMode="numeric" className={inputClassName} {...register('bathrooms')} />
          </FormField>
        )}

        <FormField label="Vagas" htmlFor="prop-parkingSpots">
          <input id="prop-parkingSpots" type="number" min="0" inputMode="numeric" className={inputClassName} {...register('parkingSpots')} />
        </FormField>

        {type?.floors && (
          <>
            <FormField label="Andar do imóvel" htmlFor="prop-unitFloor">
              <input id="prop-unitFloor" type="number" min="0" inputMode="numeric" className={inputClassName} {...register('unitFloor')} />
            </FormField>
            <FormField label="Andares do prédio" htmlFor="prop-buildingFloors">
              <input
                id="prop-buildingFloors"
                type="number"
                min="0"
                inputMode="numeric"
                className={inputClassName}
                {...register('buildingFloors')}
              />
            </FormField>
          </>
        )}

        <FormField label="Ano de construção" htmlFor="prop-yearBuilt" error={errors.yearBuilt?.message}>
          <input id="prop-yearBuilt" type="number" inputMode="numeric" className={inputClassName} {...register('yearBuilt')} />
        </FormField>

        <FormField label="Condomínio (R$/mês)" htmlFor="prop-condoFee">
          <MaskedInput id="prop-condoFee" control={control} name="condoFee" mask={currencyMask} placeholder="R$ 0,00" />
        </FormField>

        <FormField label="IPTU (R$)" htmlFor="prop-iptuValue" fullWidth>
          <div className="flex flex-col gap-2 sm:flex-row">
            <div className="flex-1">
              <MaskedInput id="prop-iptuValue" control={control} name="iptuValue" mask={currencyMask} placeholder="R$ 0,00" />
            </div>
            <Controller
              control={control}
              name="iptuPeriod"
              render={({ field }) => (
                <ChoiceGroup
                  name="iptu-period"
                  label="Período do IPTU"
                  value={field.value}
                  options={[
                    { value: 'anual', label: 'Anual' },
                    { value: 'mensal', label: 'Mensal' },
                  ]}
                  onChange={field.onChange}
                />
              )}
            />
          </div>
        </FormField>
      </FieldGrid>

      {config && (
        <div>
          <p className="mb-1.5 text-[13px] font-medium text-neutral-900">Características</p>
          <Controller
            control={control}
            name="features"
            render={({ field }) => <FeaturesPicker config={config} value={field.value} onChange={field.onChange} />}
          />
          {errors.features?.message && <p className="mt-1 text-[12px] text-danger">{errors.features.message}</p>}
        </div>
      )}
    </div>
  )
}

// ---------------- 4. Descrição e portais ----------------

const TRI_OPTIONS: { value: TriState; label: string }[] = [
  { value: 'sim', label: 'Sim' },
  { value: 'nao', label: 'Não' },
  { value: '', label: 'Não informado' },
]

export function TabPortal({
  config,
  type,
  readiness,
  onGoTo,
}: {
  config: PortalConfig | undefined
  type: PortalPropertyType | undefined
  readiness: PortalReadiness | undefined
  onGoTo: (key: PortalReadinessKey) => void
}) {
  const { register, control, setValue, getValues, formState } = useFormContext<ResaleFormValues>()
  const values = useWatch({ control })
  const { errors } = formState
  const limits = config?.limits
  const description = values.description ?? ''
  const title = values.title ?? ''
  const exclusive = values.exclusive ?? false
  const publish = values.publishToPortals ?? false
  const ready = readiness?.ready ?? false

  const aiDisabledReason =
    !values.propertyType || !values.neighborhood?.trim() || !values.city?.trim()
      ? 'Preencha tipo, bairro e cidade para gerar.'
      : null

  return (
    <div className="space-y-6">
      <FormField label="Descrição" htmlFor="prop-description" error={errors.description?.message} fullWidth>
        <textarea
          id="prop-description"
          rows={8}
          maxLength={limits?.DESC_MAX ?? 3000}
          className={inputClassName}
          {...register('description')}
        />
        <div className="mt-1 flex items-center justify-between gap-2">
          <span className="text-xs text-neutral-400">
            {limits ? `Mínimo de ${limits.DESC_MIN} para os portais. Sem HTML.` : ''}
          </span>
          <Counter value={description.length} max={limits?.DESC_MAX ?? 3000} />
        </div>
      </FormField>

      <AiDescribePanel
        buildRequest={() => resaleAiRequest(getValues(), type)}
        disabledReason={aiDisabledReason}
        currentTitle={title}
        currentDescription={description}
        onApply={(changes) => {
          const options = { shouldDirty: true, shouldValidate: true }
          if (changes.title !== undefined) setValue('title', changes.title, options)
          if (changes.description !== undefined) setValue('description', changes.description, options)
        }}
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <p className="mb-1.5 text-[13px] font-medium text-neutral-900">Aceita FGTS</p>
          <Controller
            control={control}
            name="acceptsFgts"
            render={({ field }) => (
              <ChoiceGroup name="fgts" label="Aceita FGTS" value={field.value} options={TRI_OPTIONS} onChange={field.onChange} />
            )}
          />
        </div>
        <div>
          <p className="mb-1.5 text-[13px] font-medium text-neutral-900">Aceita financiamento</p>
          <Controller
            control={control}
            name="acceptsFinancing"
            render={({ field }) => (
              <ChoiceGroup
                name="financing"
                label="Aceita financiamento"
                value={field.value}
                options={TRI_OPTIONS}
                onChange={field.onChange}
              />
            )}
          />
        </div>
      </div>

      <div className="space-y-4 rounded-[16px] border-[0.5px] border-neutral-200 p-4">
        <label className="flex min-h-11 items-center justify-between gap-3">
          <span className="text-sm font-medium text-neutral-900">Exclusividade</span>
          <Controller
            control={control}
            name="exclusive"
            render={({ field }) => <Switch checked={field.value} onCheckedChange={field.onChange} aria-label="Exclusividade" />}
          />
        </label>
        {exclusive && (
          <FormField label="Comissão (%)" htmlFor="prop-commission" error={errors.commissionPct?.message}>
            <input id="prop-commission" inputMode="decimal" className={inputClassName} {...register('commissionPct')} />
          </FormField>
        )}
        <FormField label="Observações internas" htmlFor="prop-internalNotes" error={errors.internalNotes?.message}>
          <textarea id="prop-internalNotes" rows={3} maxLength={2000} className={inputClassName} {...register('internalNotes')} />
          <p className="mt-1 text-xs text-neutral-400">Só para a equipe: nunca são publicadas.</p>
        </FormField>
      </div>

      <ReadinessCard readiness={readiness} onGoTo={onGoTo} />

      <div className="space-y-2 rounded-[16px] border-[0.5px] border-neutral-200 p-4">
        <label className="flex min-h-11 items-center justify-between gap-3">
          <span className="text-sm font-medium text-neutral-900">Publicar nos portais</span>
          <Controller
            control={control}
            name="publishToPortals"
            render={({ field }) => (
              <Switch
                checked={field.value}
                // Desligar é sempre permitido; ligar só com o checklist completo
                disabled={!field.value && !ready}
                onCheckedChange={field.onChange}
                aria-label="Publicar nos portais"
              />
            )}
          />
        </label>
        <p className="text-xs text-neutral-400">
          O envio automático chega em uma próxima etapa. Ligar agora deixa o imóvel marcado e pronto.
        </p>
        {!ready && readiness && readiness.missing.length > 0 && (
          <div className={`rounded-[8px] p-2.5 text-xs ${publish ? 'bg-[#FFEBEE] text-danger' : 'bg-neutral-100 text-neutral-600'}`}>
            <p className="font-medium">
              {publish ? 'Complete o checklist ou desligue para salvar. Falta:' : 'Para ligar, falta:'}
            </p>
            <ul className="mt-1 list-disc pl-4">
              {readiness.missing.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  )
}
