import { z } from 'zod'
import type { DefaultValues } from 'react-hook-form'
import type { LeadInterest, LeadSource, MaritalStatus } from '@/types'
import { PROPERTY_TYPES } from '@/features/empreendimentos/constants'
import { SOURCE_META, INTEREST_META } from '../constants'
import {
  EDUCATION_LEVELS,
  GENDERS,
  LEAD_URGENCIES,
  MARITAL_STATUS_META,
  PERSON_TYPES,
  PREPONENT_RELATIONS,
} from './options'

const SOURCE_VALUES = Object.keys(SOURCE_META) as [LeadSource, ...LeadSource[]]
const INTEREST_VALUES = Object.keys(INTEREST_META) as [LeadInterest, ...LeadInterest[]]
const MARITAL_STATUS_VALUES = Object.keys(MARITAL_STATUS_META) as [MaritalStatus, ...MaritalStatus[]]

const DATE_REGEX = /^\d{2}\/\d{2}\/\d{4}$/

const optionalDateField = z
  .string()
  .optional()
  .refine((value) => !value || DATE_REGEX.test(value), { message: 'Use o formato DD/MM/AAAA' })

const optionalEmailField = z
  .string()
  .optional()
  .refine((value) => !value || z.string().email().safeParse(value).success, {
    message: 'Digite um email válido',
  })

// Native <select> reports '' (not undefined) until chosen, so optional enums must accept it
function optionalSelectEnum<T extends readonly [string, ...string[]]>(values: T) {
  return z.enum([...values, ''] as [T[number] | '', ...(T[number] | '')[]]).optional()
}

export const addressSchema = z.object({
  cep: z.string().optional(),
  street: z.string().optional(),
  number: z.string().optional(),
  complement: z.string().optional(),
  neighborhood: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
})

export type AddressFormValues = z.infer<typeof addressSchema>

export const basicInfoSchema = z.object({
  personType: z.enum(PERSON_TYPES).optional(),
  source: z.enum(SOURCE_VALUES, { message: 'Selecione a origem' }),
  name: z.string().min(1, 'Informe o nome completo'),
  maritalStatus: optionalSelectEnum(MARITAL_STATUS_VALUES),
  cpf: z.string().optional(),
  phone: z.string().min(8, 'Informe um telefone válido'),
  phone2: z.string().optional(),
  income: z.string().optional(),
  interestValue: z.string().optional(),
  fgtsValue: z.string().optional(),
  ownResources: z.string().optional(),
  hasClt3Years: z.boolean(),
  email: optionalEmailField,
  intent: z.enum(INTEREST_VALUES, { message: 'Selecione o tipo de atendimento' }),
  urgency: optionalSelectEnum(LEAD_URGENCIES),
  propertyType: optionalSelectEnum(PROPERTY_TYPES),
  tags: z.array(z.string()),
  notes: z.string().optional(),
  isInvestor: z.boolean(),
  isInterested: z.boolean(),
  isOwner: z.boolean(),
  capturedByBrokerId: z.string().optional(),
  responsibleBrokerId: z.string().optional(),
})

export type BasicInfoFormValues = z.infer<typeof basicInfoSchema>

export const extraDataSchema = z.object({
  pis: z.string().optional(),
  birthplace: z.string().optional(),
  rg: z.string().optional(),
  rgIssueDate: optionalDateField,
  education: optionalSelectEnum(EDUCATION_LEVELS),
  incomeForAnalysis: z.string().optional(),
  birthDate: optionalDateField,
  occupation: z.string().optional(),
  fatherName: z.string().optional(),
  motherName: z.string().optional(),
})

export type ExtraDataFormValues = z.infer<typeof extraDataSchema>

export const preponentInputSchema = z.object({
  relation: z.enum(PREPONENT_RELATIONS, { message: 'Selecione o tipo' }),
  cpf: z.string().min(1, 'Informe o CPF'),
  name: z.string().min(1, 'Informe o nome'),
  gender: optionalSelectEnum(GENDERS),
  birthDate: optionalDateField,
  maritalStatus: optionalSelectEnum(MARITAL_STATUS_VALUES),
  birthplace: z.string().optional(),
  familyIncome: z.string().optional(),
  pis: z.string().optional(),
  rg: z.string().optional(),
  issuingBody: z.string().optional(),
  issueDate: optionalDateField,
  occupation: z.string().optional(),
  education: optionalSelectEnum(EDUCATION_LEVELS),
  cep: z.string().optional(),
  street: z.string().optional(),
  number: z.string().optional(),
  complement: z.string().optional(),
  neighborhood: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  email: optionalEmailField,
  phone: z.string().optional(),
})

export type PreponentInputValues = z.infer<typeof preponentInputSchema>

export const preponentSchema = preponentInputSchema.extend({
  id: z.string(),
})

export type PreponentFormValues = z.infer<typeof preponentSchema>

export const leadFormSchema = z.object({
  basic: basicInfoSchema,
  address: addressSchema,
  extra: extraDataSchema,
  preponents: z.array(preponentSchema),
})

export type LeadFormValues = z.infer<typeof leadFormSchema>

export const leadFormDefaultValues: DefaultValues<LeadFormValues> = {
  basic: {
    personType: 'fisica',
    name: '',
    cpf: '',
    phone: '',
    phone2: '',
    income: '',
    interestValue: '',
    fgtsValue: '',
    ownResources: '',
    hasClt3Years: false,
    email: '',
    tags: [],
    notes: '',
    isInvestor: false,
    isInterested: false,
    isOwner: false,
    capturedByBrokerId: '',
    responsibleBrokerId: '',
  },
  address: {
    cep: '',
    street: '',
    number: '',
    complement: '',
    neighborhood: '',
    city: '',
    state: '',
  },
  extra: {
    pis: '',
    birthplace: '',
    rg: '',
    rgIssueDate: '',
    incomeForAnalysis: '',
    birthDate: '',
    occupation: '',
    fatherName: '',
    motherName: '',
  },
  preponents: [],
}

export const preponentDefaultValues: DefaultValues<PreponentInputValues> = {
  cpf: '',
  name: '',
  birthDate: '',
  birthplace: '',
  familyIncome: '',
  pis: '',
  rg: '',
  issuingBody: '',
  issueDate: '',
  occupation: '',
  cep: '',
  street: '',
  number: '',
  complement: '',
  neighborhood: '',
  city: '',
  state: '',
  email: '',
  phone: '',
}
