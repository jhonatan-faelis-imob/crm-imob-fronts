import { useFormContext } from 'react-hook-form'
import { FieldGrid, FormField, inputClassName } from './field'
import { MaskedInput } from './masked-input'
import { cepMask } from './masks'
import { useAddressLookup } from './use-address-lookup'
import type { LeadFormValues } from './schema'

export function TabAddress() {
  const {
    register,
    control,
    getValues,
    setValue,
  } = useFormContext<LeadFormValues>()
  const { lookup, isLoading, error } = useAddressLookup()

  async function handleAutoComplete() {
    const result = await lookup(getValues('address.cep') ?? '')
    if (!result) return
    setValue('address.street', result.street, { shouldValidate: true, shouldDirty: true })
    setValue('address.neighborhood', result.neighborhood, { shouldValidate: true, shouldDirty: true })
    setValue('address.city', result.city, { shouldValidate: true, shouldDirty: true })
    setValue('address.state', result.state, { shouldValidate: true, shouldDirty: true })
  }

  return (
    <div className="space-y-4">
      <FieldGrid>
        <FormField label="CEP" htmlFor="cep" error={error ?? undefined}>
          <div className="flex gap-2">
            <MaskedInput id="cep" control={control} name="address.cep" mask={cepMask} placeholder="00000-000" />
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

        <FormField label="Endereço" htmlFor="street">
          <input id="street" className={inputClassName} {...register('address.street')} />
        </FormField>

        <FormField label="Número" htmlFor="number">
          <input id="number" className={inputClassName} {...register('address.number')} />
        </FormField>

        <FormField label="Complemento" htmlFor="complement" fullWidth>
          <input id="complement" className={inputClassName} {...register('address.complement')} />
        </FormField>

        <FormField label="Bairro" htmlFor="neighborhood" fullWidth>
          <input id="neighborhood" className={inputClassName} {...register('address.neighborhood')} />
        </FormField>

        <FormField label="Cidade" htmlFor="city">
          <input id="city" className={inputClassName} {...register('address.city')} />
        </FormField>

        <FormField label="Estado" htmlFor="state">
          <input id="state" className={inputClassName} {...register('address.state')} />
        </FormField>
      </FieldGrid>
    </div>
  )
}
