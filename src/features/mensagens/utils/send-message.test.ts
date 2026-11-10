import { describe, expect, it, vi } from 'vitest'
import { buildDraft, openWhatsAppAndLog } from './send-message'

const context = { leadName: 'Maria Souza', brokerName: 'João', now: new Date('2026-11-10T18:00:00Z') }

describe('openWhatsAppAndLog', () => {
  it('abre o WhatsApp mesmo quando o send-log falha, e avisa da falha', async () => {
    const calls: string[] = []
    const openWindow = vi.fn(() => {
      calls.push('open')
      return {}
    })
    const error = new Error('400 leadId must be a UUID')
    const log = vi.fn(() => {
      calls.push('log')
      return Promise.reject(error)
    })
    const onLogged = vi.fn()
    const onLogFailed = vi.fn()

    const opened = openWhatsAppAndLog({ url: 'https://wa.me/5519', openWindow, log, onLogged, onLogFailed })

    // Abriu na hora, antes de qualquer chamada assíncrona terminar
    expect(opened).toBe(true)
    expect(calls).toEqual(['open', 'log'])
    await vi.waitFor(() => expect(onLogFailed).toHaveBeenCalledWith(error))
    expect(onLogged).not.toHaveBeenCalled()
  })

  it('janela bloqueada pelo navegador: não registra nada', () => {
    const log = vi.fn(() => Promise.resolve())
    expect(openWhatsAppAndLog({ url: 'x', openWindow: () => null, log, onLogged: vi.fn(), onLogFailed: vi.fn() })).toBe(false)
    expect(log).not.toHaveBeenCalled()
  })
})

// O serviço é falso: qualquer chamada de render falharia o teste
const service = vi.hoisted(() => ({
  render: vi.fn(),
  renderFree: vi.fn(),
  sendLog: vi.fn(),
  sendLogFree: vi.fn(),
}))
vi.mock('@/services/message-templates.service', () => ({ messageTemplatesService: service }))

describe('buildDraft (escolha do modelo no botão)', () => {
  it('não chama render quando o modelo não tem {{documentos_pendentes}}', async () => {
    const draft = await buildDraft(
      { id: 't1', name: 'Boas-vindas', content: '{{saudacao}}, {{primeiro_nome}}! Sou {{corretor}}.' },
      () => Promise.resolve(context),
    )
    expect(draft.text).toBe('Boa tarde, Maria! Sou João.')
    expect(service.render).not.toHaveBeenCalled()
    expect(service.renderFree).not.toHaveBeenCalled()
  })

  it('com {{documentos_pendentes}} também monta local e deixa a variável para o modal buscar', async () => {
    const draft = await buildDraft({ id: 't2', name: 'Docs', content: 'Oi {{primeiro_nome}}:\n{{documentos_pendentes}}' }, () => Promise.resolve(context))
    expect(draft.text).toBe('Oi Maria:\n{{documentos_pendentes}}')
    expect(service.render).not.toHaveBeenCalled()
  })

  it('mensagem livre abre vazia, com o contexto para "Preencher variáveis"', async () => {
    const draft = await buildDraft(null, () => Promise.resolve(context))
    expect(draft).toMatchObject({ templateId: null, text: '', context })
  })
})
