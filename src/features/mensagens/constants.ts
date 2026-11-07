import type { MessageTemplate, MessageTemplateType } from '@/types'

export const MAX_TEMPLATE_LENGTH = 1000

export const TEMPLATE_TYPES: { value: MessageTemplateType; label: string; bg: string; text: string }[] = [
  { value: 'primeiro_contato', label: 'Primeiro contato', bg: '#EBF5FF', text: '#0070F3' },
  { value: 'follow_up', label: 'Follow-up', bg: '#F3E8FF', text: '#7C3AED' },
  { value: 'agendamento', label: 'Agendamento', bg: '#FFF3E0', text: '#C45800' },
  { value: 'pos_visita', label: 'Pós-visita', bg: '#FFF7E0', text: '#B45309' },
  { value: 'proposta', label: 'Proposta', bg: '#FFF0F2', text: '#E31C5F' },
  { value: 'pos_venda', label: 'Pós-venda', bg: '#E8F5E9', text: '#008A05' },
  { value: 'outro', label: 'Outro', bg: '#F7F7F7', text: '#767676' },
]

export function templateTypeMeta(type: MessageTemplateType | null) {
  return TEMPLATE_TYPES.find((item) => item.value === type) ?? TEMPLATE_TYPES[TEMPLATE_TYPES.length - 1]
}

export const TEMPLATE_VARIABLES = [
  { key: 'saudacao', sample: 'Bom dia' },
  { key: 'nome', sample: 'Maria Souza' },
  { key: 'primeiro_nome', sample: 'Maria' },
  { key: 'empreendimento', sample: 'Residencial Italo' },
  { key: 'corretor', sample: 'João Lima' },
  { key: 'telefone_corretor', sample: '(11) 99999-0000' },
  { key: 'imobiliaria', sample: 'Imobiliária Exemplo' },
]

const PLACEHOLDER_PATTERN = /\{\{([^{}]+)\}\}/g

export function findPlaceholders(text: string) {
  return Array.from(new Set(Array.from(text.matchAll(PLACEHOLDER_PATTERN), (match) => match[1].trim())))
}

export function renderSample(content: string) {
  return content.replace(PLACEHOLDER_PATTERN, (placeholder, name: string) => {
    return TEMPLATE_VARIABLES.find((variable) => variable.key === name.trim())?.sample ?? placeholder
  })
}

type TemplateUser = { id: string; role: string } | null

export function canShareTemplates(user: TemplateUser) {
  return !!user && ['coordenador', 'gerente', 'diretor'].includes(user.role)
}

// Espelha assertCanManage em message-templates.service.ts, que continua sendo quem decide
export function canManageTemplate(template: MessageTemplate, user: TemplateUser) {
  if (!user) return false
  if (template.isPublic) return user.role === 'gerente' || user.role === 'diretor'
  return template.userId === user.id
}
