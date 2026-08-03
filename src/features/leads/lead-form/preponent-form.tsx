import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { FieldGrid, FormField, IconInputWrapper, inputClassName, inputWithIconClassName } from './field'
import { MaskedDateInput } from './masked-date-input'
import { MaskedInput } from './masked-input'
import { cepMask, cpfMask, currencyMask, phoneMask } from './masks'
import {
  EDUCATION_LEVEL_META,
  EDUCATION_LEVELS,
  GENDER_META,
  GENDERS,
  MARITAL_STATUS_META,
  PREPONENT_RELATION_META,
  PREPONENT_RELATIONS,
} from './options'
import { preponentDefaultValues, preponentInputSchema, type PreponentInputValues } from './schema'
import { useAddressLookup } from './use-address-lookup'
import type { MaritalStatus } from '@/types'
import { Mail, Phone } from 'lucide-react'

const MARITAL_STATUS_VALUES = Object.keys(MARITAL_STATUS_META) as MaritalStatus[]

const sectionTitleClassName = 'text-sm font-semibold text-neutral-900'

export function PreponentForm({
  onAdd,
  onClose,
}: {
  onAdd: (values: PreponentInputValues) => void
  onClose: () => void
}) {
  const {
    register,
    control,
    handleSubmit,
    getValues,
    setValue,
    formState: { errors },
  } = useForm<PreponentInputValues>({
    resolver: zodResolver(preponentInputSchema),
    defaultValues: preponentDefaultValues,
  })
  const { lookup, isLoading, error: cepError } = useAddressLookup()

  async function handleAutoComplete() {
    const result = await lookup(getValues('cep') ?? '')
    if (!result) return
    setValue('street', result.street, { shouldValidate: true, shouldDirty: true })
    setValue('neighborhood', result.neighborhood, { shouldValidate: true, shouldDirty: true })
    setValue('city', result.city, { shouldValidate: true, shouldDirty: true })
    setValue('state', result.state, { shouldValidate: true, shouldDirty: true })
  }

  function onSubmit(values: PreponentInputValues) {
    onAdd(values)
  }

  return (
    <div className="space-y-5 rounded-[16px] border-[0.5px] border-neutral-200 bg-neutral-100 p-4">
      <div className="space-y-3">
        <p className={sectionTitleClassName}>Dados de associação</p>
        <FieldGrid>
          <FormField label="Tipo" htmlFor="p-relation" required error={errors.relation?.message}>
            <select id="p-relation" defaultValue="" className={inputClassName} {...register('relation')}>
              <option value="" disabled>
                Selecione
              </option>
              {PREPONENT_RELATIONS.map((relation) => (
                <option key={relation} value={relation}>
                  {PREPONENT_RELATION_META[relation]}
                </option>
              ))}
            </select>
          </FormField>
        </FieldGrid>
      </div>

      <div className="space-y-3">
        <p className={sectionTitleClassName}>Dados da pessoa física</p>
        <FieldGrid>
          <FormField label="CPF" htmlFor="p-cpf" required error={errors.cpf?.message}>
            <MaskedInput id="p-cpf" control={control} name="cpf" mask={cpfMask} placeholder="000.000.000-00" />
          </FormField>

          <FormField label="Nome" htmlFor="p-name" required error={errors.name?.message}>
            <input id="p-name" className={inputClassName} {...register('name')} />
          </FormField>

          <FormField label="Gênero" htmlFor="p-gender">
            <select id="p-gender" defaultValue="" className={inputClassName} {...register('gender')}>
              <option value="" disabled>
                Selecione
              </option>
              {GENDERS.map((gender) => (
                <option key={gender} value={gender}>
                  {GENDER_META[gender]}
                </option>
              ))}
            </select>
          </FormField>

          <FormField label="Data de nascimento" htmlFor="p-birthDate" error={errors.birthDate?.message}>
            <MaskedDateInput control={control} name="birthDate" id="p-birthDate" />
          </FormField>

          <FormField label="Estado civil" htmlFor="p-maritalStatus">
            <select id="p-maritalStatus" defaultValue="" className={inputClassName} {...register('maritalStatus')}>
              <option value="" disabled>
                Selecione
              </option>
              {MARITAL_STATUS_VALUES.map((status) => (
                <option key={status} value={status}>
                  {MARITAL_STATUS_META[status]}
                </option>
              ))}
            </select>
          </FormField>

          <FormField label="Naturalidade" htmlFor="p-birthplace">
            <input id="p-birthplace" className={inputClassName} {...register('birthplace')} />
          </FormField>

          <FormField label="Renda familiar" htmlFor="p-familyIncome">
            <MaskedInput
              id="p-familyIncome"
              control={control}
              name="familyIncome"
              mask={currencyMask}
              placeholder="R$ 0,00"
            />
          </FormField>

          <FormField label="Número do PIS" htmlFor="p-pis">
            <input id="p-pis" className={inputClassName} {...register('pis')} />
          </FormField>

          <FormField label="RG" htmlFor="p-rg">
            <input id="p-rg" className={inputClassName} {...register('rg')} />
          </FormField>

          <FormField label="Órgão emissor" htmlFor="p-issuingBody">
            <input id="p-issuingBody" className={inputClassName} {...register('issuingBody')} />
          </FormField>

          <FormField label="Data de emissão" htmlFor="p-issueDate" error={errors.issueDate?.message}>
            <MaskedDateInput control={control} name="issueDate" id="p-issueDate" />
          </FormField>

          <FormField label="Profissão" htmlFor="p-occupation">
            <input id="p-occupation" className={inputClassName} {...register('occupation')} />
          </FormField>

          <FormField label="Escolaridade" htmlFor="p-education">
            <select id="p-education" defaultValue="" className={inputClassName} {...register('education')}>
              <option value="" disabled>
                Selecione
              </option>
              {EDUCATION_LEVELS.map((level) => (
                <option key={level} value={level}>
                  {EDUCATION_LEVEL_META[level]}
                </option>
              ))}
            </select>
          </FormField>
        </FieldGrid>
      </div>

      <div className="space-y-3">
        <p className={sectionTitleClassName}>Dados de endereço</p>
        <FieldGrid>
          <FormField label="CEP" htmlFor="p-cep" error={cepError ?? undefined}>
            <div className="flex gap-2">
              <MaskedInput id="p-cep" control={control} name="cep" mask={cepMask} placeholder="00000-000" />
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

          <FormField label="Endereço" htmlFor="p-street">
            <input id="p-street" className={inputClassName} {...register('street')} />
          </FormField>

          <FormField label="Número" htmlFor="p-number">
            <input id="p-number" className={inputClassName} {...register('number')} />
          </FormField>

          <FormField label="Complemento" htmlFor="p-complement" fullWidth>
            <input id="p-complement" className={inputClassName} {...register('complement')} />
          </FormField>

          <FormField label="Bairro" htmlFor="p-neighborhood" fullWidth>
            <input id="p-neighborhood" className={inputClassName} {...register('neighborhood')} />
          </FormField>

          <FormField label="Cidade" htmlFor="p-city">
            <input id="p-city" className={inputClassName} {...register('city')} />
          </FormField>

          <FormField label="Estado" htmlFor="p-state">
            <input id="p-state" className={inputClassName} {...register('state')} />
          </FormField>
        </FieldGrid>
      </div>

      <div className="space-y-3">
        <p className={sectionTitleClassName}>Dados de contato</p>
        <FieldGrid>
          <FormField label="E-mail" htmlFor="p-email" error={errors.email?.message}>
            <IconInputWrapper icon={<Mail className="h-4 w-4" />}>
              <input id="p-email" type="email" className={inputWithIconClassName} {...register('email')} />
            </IconInputWrapper>
          </FormField>

          <FormField label="Telefone principal" htmlFor="p-phone">
            <IconInputWrapper icon={<Phone className="h-4 w-4" />}>
              <MaskedInput
                id="p-phone"
                control={control}
                name="phone"
                mask={phoneMask}
                placeholder="(11) 99999-9999"
                className={inputWithIconClassName}
              />
            </IconInputWrapper>
          </FormField>
        </FieldGrid>
      </div>

      <div className="flex justify-end gap-2 border-t-[0.5px] border-neutral-200 pt-4">
        <button
          type="button"
          onClick={onClose}
          className="rounded-[8px] border-[1.5px] border-neutral-200 px-4 py-2.5 text-sm font-medium text-neutral-600"
        >
          Fechar
        </button>
        <button
          type="button"
          onClick={handleSubmit(onSubmit)}
          className="rounded-[8px] bg-brand px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-brand-dark"
        >
          Adicionar
        </button>
      </div>
    </div>
  )
}
