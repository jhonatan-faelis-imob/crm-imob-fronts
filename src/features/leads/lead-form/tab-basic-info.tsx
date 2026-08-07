import { Clock, DollarSign, Mail, Phone } from 'lucide-react'
import { useFormContext } from 'react-hook-form'
import type { LeadInterest, LeadSource, MaritalStatus } from '@/types'
import { PROPERTY_TYPE_META, PROPERTY_TYPES } from '@/features/empreendimentos/constants'
import { ROLE_LABELS } from '@/lib/utils'
import { INTEREST_META, SOURCE_META } from '../constants'
import { FieldGrid, FormField, IconInputWrapper, inputClassName, inputWithIconClassName } from './field'
import { MaskedInput } from './masked-input'
import { cpfMask, currencyMask, phoneMask } from './masks'
import { LEAD_URGENCIES, LEAD_URGENCY_META, MARITAL_STATUS_META, PERSON_TYPE_META, PERSON_TYPES, TAG_SUGGESTIONS } from './options'
import { TagsInput } from './tags-input'
import type { LeadFormValues } from './schema'

const SOURCE_VALUES = Object.keys(SOURCE_META) as LeadSource[]
const INTEREST_VALUES = Object.keys(INTEREST_META) as LeadInterest[]
const MARITAL_STATUS_VALUES = Object.keys(MARITAL_STATUS_META) as MaritalStatus[]

export interface BrokerOption {
  id: string
  name: string
  role: string
}

export function TabBasicInfo({ brokers }: { brokers: BrokerOption[] }) {
  const {
    register,
    control,
    formState: { errors },
  } = useFormContext<LeadFormValues>()
  const basicErrors = errors.basic

  return (
    <div className="space-y-4">
      <FieldGrid>
        <FormField label="Tipo de cadastro" htmlFor="personType">
          <select id="personType" className={inputClassName} {...register('basic.personType')}>
            {PERSON_TYPES.map((type) => (
              <option key={type} value={type}>
                {PERSON_TYPE_META[type]}
              </option>
            ))}
          </select>
        </FormField>

        <FormField label="Origem" htmlFor="source" required error={basicErrors?.source?.message}>
          <select
            id="source"
            defaultValue=""
            className={inputClassName}
            {...register('basic.source')}
          >
            <option value="" disabled>
              Selecione a origem
            </option>
            {SOURCE_VALUES.map((value) => (
              <option key={value} value={value}>
                {SOURCE_META[value].label}
              </option>
            ))}
          </select>
        </FormField>

        <FormField label="Nome completo" htmlFor="name" required error={basicErrors?.name?.message}>
          <input id="name" className={inputClassName} {...register('basic.name')} />
        </FormField>

        <FormField label="Estado civil" htmlFor="maritalStatus">
          <select id="maritalStatus" defaultValue="" className={inputClassName} {...register('basic.maritalStatus')}>
            <option value="" disabled>
              Selecione
            </option>
            {MARITAL_STATUS_VALUES.map((value) => (
              <option key={value} value={value}>
                {MARITAL_STATUS_META[value]}
              </option>
            ))}
          </select>
        </FormField>

        <FormField label="CPF" htmlFor="cpf">
          <MaskedInput
            id="cpf"
            control={control}
            name="basic.cpf"
            mask={cpfMask}
            placeholder="000.000.000-00"
          />
        </FormField>

        <FormField
          label="Telefone principal"
          htmlFor="phone"
          required
          error={basicErrors?.phone?.message}
        >
          <IconInputWrapper icon={<Phone className="h-4 w-4" />}>
            <MaskedInput
              id="phone"
              control={control}
              name="basic.phone"
              mask={phoneMask}
              placeholder="(11) 99999-9999"
              className={inputWithIconClassName}
            />
          </IconInputWrapper>
        </FormField>

        <FormField label="Telefone adicional" htmlFor="phone2">
          <IconInputWrapper icon={<Phone className="h-4 w-4" />}>
            <MaskedInput
              id="phone2"
              control={control}
              name="basic.phone2"
              mask={phoneMask}
              placeholder="(11) 99999-9999"
              className={inputWithIconClassName}
            />
          </IconInputWrapper>
        </FormField>

        <FormField label="E-mail" htmlFor="email" error={basicErrors?.email?.message}>
          <IconInputWrapper icon={<Mail className="h-4 w-4" />}>
            <input
              id="email"
              type="email"
              className={inputWithIconClassName}
              {...register('basic.email')}
            />
          </IconInputWrapper>
        </FormField>

        <FormField
          label="Tipo de atendimento"
          htmlFor="intent"
          required
          error={basicErrors?.intent?.message}
        >
          <select id="intent" defaultValue="" className={inputClassName} {...register('basic.intent')}>
            <option value="" disabled>
              Selecione
            </option>
            {INTEREST_VALUES.map((value) => (
              <option key={value} value={value}>
                {INTEREST_META[value]}
              </option>
            ))}
          </select>
        </FormField>

        <FormField label="Urgência" htmlFor="urgency">
          <IconInputWrapper icon={<Clock className="h-4 w-4" />}>
            <select
              id="urgency"
              defaultValue=""
              className={inputWithIconClassName}
              {...register('basic.urgency')}
            >
              <option value="" disabled>
                Selecione
              </option>
              {LEAD_URGENCIES.map((value) => (
                <option key={value} value={value}>
                  {LEAD_URGENCY_META[value].emoji} {LEAD_URGENCY_META[value].label}
                </option>
              ))}
            </select>
          </IconInputWrapper>
        </FormField>

        <FormField label="Tipo de imóvel" htmlFor="propertyType">
          <select id="propertyType" defaultValue="" className={inputClassName} {...register('basic.propertyType')}>
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

        <FormField label="Informações extras" htmlFor="notes" fullWidth>
          <textarea id="notes" rows={3} className={inputClassName} {...register('basic.notes')} />
        </FormField>

        <FormField label="Tags" htmlFor="tags" fullWidth>
          <TagsInput control={control} name="basic.tags" id="tags" suggestions={TAG_SUGGESTIONS} />
        </FormField>
      </FieldGrid>

      <div className="border-t-[0.5px] border-neutral-200 pt-4">
        <p className="mb-3 flex items-center gap-2 text-sm font-semibold text-neutral-900">
          <DollarSign className="h-4 w-4 text-brand" />
          Informações financeiras
        </p>
        <FieldGrid>
          <FormField label="Renda familiar" htmlFor="income">
            <MaskedInput
              id="income"
              control={control}
              name="basic.income"
              mask={currencyMask}
              placeholder="R$ 0,00"
            />
          </FormField>

          <FormField label="Valor de interesse" htmlFor="interestValue">
            <MaskedInput
              id="interestValue"
              control={control}
              name="basic.interestValue"
              mask={currencyMask}
              placeholder="R$ 0,00"
            />
          </FormField>

          <FormField label="FGTS disponível" htmlFor="fgtsValue">
            <MaskedInput
              id="fgtsValue"
              control={control}
              name="basic.fgtsValue"
              mask={currencyMask}
              placeholder="R$ 0,00"
            />
          </FormField>

          <FormField label="Recursos próprios" htmlFor="ownResources">
            <MaskedInput
              id="ownResources"
              control={control}
              name="basic.ownResources"
              mask={currencyMask}
              placeholder="R$ 0,00"
            />
          </FormField>
        </FieldGrid>

        <label className="mt-4 flex items-center gap-2 text-[13px] font-medium text-neutral-900">
          <input type="checkbox" className="h-4 w-4 accent-brand" {...register('basic.hasClt3Years')} />
          Possui mais de 3 anos de registro CLT
        </label>
      </div>

      <div className="flex flex-wrap items-center gap-6 border-t-[0.5px] border-neutral-200 pt-4">
        <label className="flex items-center gap-2 text-[13px] font-medium text-neutral-900">
          <input type="checkbox" className="h-4 w-4 accent-brand" {...register('basic.isInvestor')} />
          Investidor
        </label>
        <label className="flex items-center gap-2 text-[13px] font-medium text-neutral-900">
          <input type="checkbox" className="h-4 w-4 accent-brand" {...register('basic.isInterested')} />
          Cliente interessado
        </label>
        <label className="flex items-center gap-2 text-[13px] font-medium text-neutral-900">
          <input type="checkbox" className="h-4 w-4 accent-brand" {...register('basic.isOwner')} />
          Proprietário
        </label>
      </div>

      <FieldGrid>
        <FormField label="Corretor angariador" htmlFor="capturedByBrokerId">
          <select id="capturedByBrokerId" defaultValue="" className={inputClassName} disabled={brokers.length === 0} {...register('basic.capturedByBrokerId')}>
            <option value="" disabled>
              {brokers.length === 0 ? 'Nenhum corretor cadastrado' : 'Selecione o corretor'}
            </option>
            {brokers.map((broker) => (
              <option key={broker.id} value={broker.id}>
                {broker.name} — {ROLE_LABELS[broker.role] ?? broker.role}
              </option>
            ))}
          </select>
        </FormField>

        <FormField label="Corretor responsável" htmlFor="responsibleBrokerId">
          <select id="responsibleBrokerId" defaultValue="" className={inputClassName} disabled={brokers.length === 0} {...register('basic.responsibleBrokerId')}>
            <option value="" disabled>
              {brokers.length === 0 ? 'Nenhum corretor cadastrado' : 'Selecione o corretor'}
            </option>
            {brokers.map((broker) => (
              <option key={broker.id} value={broker.id}>
                {broker.name} — {ROLE_LABELS[broker.role] ?? broker.role}
              </option>
            ))}
          </select>
        </FormField>
      </FieldGrid>
    </div>
  )
}
