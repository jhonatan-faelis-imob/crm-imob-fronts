import { describe, expect, it } from 'vitest'
import { createdLeadToastTitle } from './created-lead-toast'

const task = { id: 't1', title: 'Ligar para Maria', type: 'ligacao' as const, dueDate: '2026-11-14T12:00:00.000Z' }

describe('createdLeadToastTitle', () => {
  it('conta as tarefas criadas pela cadência', () => {
    expect(createdLeadToastTitle({ created: [task, { ...task, id: 't2' }], cancelled: 0 })).toBe(
      'Lead criado. Criei 2 tarefas de acompanhamento.',
    )
    expect(createdLeadToastTitle({ created: [task], cancelled: 0 })).toBe('Lead criado. Criei 1 tarefa de acompanhamento.')
  })

  it('sem tarefas ou sem cadence na resposta, mantém o texto de antes', () => {
    expect(createdLeadToastTitle({ created: [], cancelled: 0 })).toBe('Lead criado com sucesso!')
    expect(createdLeadToastTitle(undefined)).toBe('Lead criado com sucesso!')
  })
})
