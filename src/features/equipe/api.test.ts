import { describe, expect, it } from 'vitest'
import { memberErrorField } from './api'

describe('memberErrorField', () => {
  it.each([
    ['Email já cadastrado', 'email'],
    ['email must be an email', 'email'],
    ['A senha deve ter no mínimo 8 caracteres', 'password'],
    ['Seu cargo não permite criar ou editar usuários com cargo Diretor', 'role'],
    ['Equipe não encontrada nesta organização', 'teamId'],
    ['Coordenador só pode colocar pessoas na própria equipe', 'teamId'],
    ['Erro inesperado', 'root'],
  ])('"%s" vai para %s', (message, field) => {
    expect(memberErrorField(message)).toBe(field)
  })
})

describe('editErrorField e deleteBlockers', () => {
  it('manda a mensagem para o campo certo, nunca para senha', async () => {
    const { editErrorField } = await import('./api')
    expect(editErrorField('Você não pode alterar o próprio cargo')).toBe('role')
    expect(editErrorField('Email já cadastrado')).toBe('email')
    expect(editErrorField('Fulano coordena a equipe "Alfa". Troque o coordenador antes de mudar a equipe.')).toBe('teamId')
    expect(editErrorField('A senha deve ter 8 caracteres')).toBe('root')
  })

  it('lê a lista de vínculos do 409', async () => {
    const { AxiosError } = await import('axios')
    const { deleteBlockers } = await import('./api')
    const error = new AxiosError('x', '409', undefined, undefined, {
      status: 409, statusText: '', headers: {}, config: { headers: undefined } as never,
      data: { blockers: [{ kind: 'leads', label: 'leads', count: 3 }, { nope: true }] },
    })
    expect(deleteBlockers(error)).toEqual([{ kind: 'leads', label: 'leads', count: 3 }])
    expect(deleteBlockers(new Error('x'))).toEqual([])
  })
})
