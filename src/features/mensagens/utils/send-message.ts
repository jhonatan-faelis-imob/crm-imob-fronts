import { hasPendingDocumentsVariable, renderTemplateLocal, type MessageContext, type RenderedMessage } from './render-template'

// Regras de rede do envio pelo WhatsApp, separadas dos componentes para serem testadas

/**
 * Abre o WhatsApp de forma síncrona (precisa sair direto do clique, senão o navegador bloqueia a aba)
 * e só depois registra a interação. Falha no registro não desfaz a abertura.
 * Devolve false quando o navegador bloqueou a janela (nada é registrado)
 */
export function openWhatsAppAndLog({
  url,
  openWindow,
  log,
  onLogged,
  onLogFailed,
}: {
  url: string
  openWindow: (url: string) => unknown
  log: () => Promise<unknown>
  onLogged: () => void
  onLogFailed: (error: unknown) => void
}): boolean {
  const opened = openWindow(url)
  if (!opened) return false
  log().then(onLogged, onLogFailed)
  return true
}

export interface PreparedMessage extends RenderedMessage {
  /** O texto tem {{documentos_pendentes}}: só o servidor sabe preencher */
  needsDocuments: boolean
}

/** Prévia local e imediata. Nenhuma chamada de rede aqui */
export function prepareMessage(content: string, ctx: MessageContext): PreparedMessage {
  const rendered = renderTemplateLocal(content, ctx)
  return { ...rendered, needsDocuments: hasPendingDocumentsVariable(rendered.text) }
}

export interface MessageDraft {
  templateId: string | null
  templateName: string
  /** Já montado no navegador (renderTemplateLocal) */
  text: string
  /** Para o "Preencher variáveis" da mensagem livre, também local */
  context?: MessageContext
}

/**
 * O que o botão faz ao escolher um modelo: carrega o contexto (cache) e monta o texto localmente.
 * Nunca chama o render do servidor; {{documentos_pendentes}} fica no texto para o modal buscar
 */
export async function buildDraft(
  template: { id: string; name: string; content: string } | null,
  loadContext: () => Promise<MessageContext>,
): Promise<MessageDraft> {
  const context = await loadContext()
  if (!template) return { templateId: null, templateName: 'Mensagem livre', text: '', context }
  return { templateId: template.id, templateName: template.name, text: prepareMessage(template.content, context).text, context }
}
