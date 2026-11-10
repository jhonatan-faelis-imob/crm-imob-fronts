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
