import type { LeadUrgency, MaritalStatus } from '@/types'

export const PERSON_TYPES = ['fisica', 'juridica'] as const
export type PersonType = (typeof PERSON_TYPES)[number]

export const PERSON_TYPE_META: Record<PersonType, string> = {
  fisica: 'Pessoa física',
  juridica: 'Pessoa jurídica',
}

export const MARITAL_STATUS_META: Record<MaritalStatus, string> = {
  solteiro: 'Solteiro(a)',
  casado: 'Casado(a)',
  divorciado: 'Divorciado(a)',
  viuvo: 'Viúvo(a)',
  uniao_estavel: 'União estável',
}

export const EDUCATION_LEVELS = ['fundamental', 'medio', 'superior', 'pos_graduacao', 'outro'] as const
export type EducationLevel = (typeof EDUCATION_LEVELS)[number]

export const EDUCATION_LEVEL_META: Record<EducationLevel, string> = {
  fundamental: 'Fundamental',
  medio: 'Médio',
  superior: 'Superior',
  pos_graduacao: 'Pós-graduação',
  outro: 'Outro',
}

export const GENDERS = ['masculino', 'feminino', 'outro'] as const
export type Gender = (typeof GENDERS)[number]

export const GENDER_META: Record<Gender, string> = {
  masculino: 'Masculino',
  feminino: 'Feminino',
  outro: 'Outro',
}

export const PREPONENT_RELATIONS = ['conjuge', 'companheiro', 'pai_mae', 'filho', 'outro'] as const
export type PreponentRelation = (typeof PREPONENT_RELATIONS)[number]

export const PREPONENT_RELATION_META: Record<PreponentRelation, string> = {
  conjuge: 'Cônjuge',
  companheiro: 'Companheiro(a)',
  pai_mae: 'Pai/Mãe',
  filho: 'Filho(a)',
  outro: 'Outro',
}

export const LEAD_URGENCIES = [
  'imediato',
  'um_mes',
  'tres_meses',
  'seis_meses',
  'sem_pressa',
] as const satisfies readonly LeadUrgency[]

export const LEAD_URGENCY_META: Record<LeadUrgency, { label: string; emoji: string; bg: string; text: string }> = {
  imediato: { label: 'Imediato', emoji: '🔴', bg: '#FFEBEE', text: '#D93B30' },
  um_mes: { label: 'Em até 1 mês', emoji: '🟠', bg: '#FFF3E0', text: '#C45800' },
  tres_meses: { label: 'Em até 3 meses', emoji: '🟡', bg: '#FFF7E0', text: '#B45309' },
  seis_meses: { label: 'Em até 6 meses', emoji: '🟢', bg: '#E8F5E9', text: '#008A05' },
  sem_pressa: { label: 'Sem pressa', emoji: '⚪', bg: '#F7F7F7', text: '#767676' },
}

export const TAG_SUGGESTIONS = ['FGTS', 'Financiamento', 'À vista', 'Permuta', 'Investidor']
