// Render das mensagens no navegador. Espelha src/modules/message-templates/render-template.ts do backend
// (mesma regex, mesma passada única, mesma regra de variável vazia). As duas implementações seguem as
// fixtures de render-fixtures.ts. O front é a fonte da prévia; o servidor só entra para
// {{documentos_pendentes}} (precisa do checklist do lead) e para registrar o envio.

export const BUSINESS_TIME_ZONE = 'America/Sao_Paulo'

const VARIABLE_PATTERN = /\{\{([^{}]+)\}\}/g
const DOCUMENTS_PATTERN = /\{\{\s*documentos_pendentes\s*\}\}/g

export const DOCUMENTS_VARIABLE = 'documentos_pendentes'

export interface MessageContext {
  leadName: string
  /** Título do primeiro imóvel vinculado ao lead */
  propertyTitle?: string | null
  brokerName?: string | null
  brokerPhone?: string | null
  agencyName?: string | null
  /** Só vem do servidor; sem ele a variável fica no texto */
  pendingDocuments?: string | null
  now?: Date
}

export interface RenderedMessage {
  text: string
  missing: string[]
}

/** Hora (0 a 23) em São Paulo, sem depender do fuso do computador */
export function businessHour(now: Date) {
  return Number(
    new Intl.DateTimeFormat('en-US', { timeZone: BUSINESS_TIME_ZONE, hour: 'numeric', hourCycle: 'h23' }).format(now),
  )
}

/** Bom dia até 11:59, Boa tarde de 12:00 a 17:59, Boa noite depois */
export function greeting(now = new Date()) {
  const hour = businessHour(now)
  if (hour < 12) return 'Bom dia'
  return hour < 18 ? 'Boa tarde' : 'Boa noite'
}

export function firstName(name: string) {
  return name.trim().split(/\s+/)[0] ?? ''
}

export function contextValues(ctx: MessageContext): Record<string, string | null | undefined> {
  return {
    nome: ctx.leadName,
    primeiro_nome: firstName(ctx.leadName),
    empreendimento: ctx.propertyTitle,
    corretor: ctx.brokerName,
    telefone_corretor: ctx.brokerPhone,
    imobiliaria: ctx.agencyName,
    saudacao: greeting(ctx.now),
    documentos_pendentes: ctx.pendingDocuments,
  }
}

/**
 * Passada única com função: o nome do lead não é reinterpretado como variável nem como padrão especial
 * do replace ($&). Vazia ou desconhecida fica no texto como {{variavel}} e entra em missing.
 * Object.hasOwn: {{constructor}} e afins são desconhecidas, não propriedades herdadas
 */
export function renderWithValues(content: string, values: Record<string, string | null | undefined>): RenderedMessage {
  const missing = new Set<string>()
  const text = content.replace(VARIABLE_PATTERN, (placeholder, rawName: string) => {
    const name = rawName.trim()
    const value = Object.hasOwn(values, name) ? values[name] : undefined
    if (value) return value
    missing.add(name)
    return placeholder
  })
  return { text, missing: Array.from(missing) }
}

export function renderTemplateLocal(content: string, ctx: MessageContext): RenderedMessage {
  return renderWithValues(content, contextValues(ctx))
}

export function hasPendingDocumentsVariable(text: string) {
  return new RegExp(DOCUMENTS_PATTERN.source).test(text)
}

/** Troca só {{documentos_pendentes}} no texto (que pode já ter sido editado) */
export function fillPendingDocuments(text: string, documents: string) {
  return text.replace(DOCUMENTS_PATTERN, () => documents)
}
