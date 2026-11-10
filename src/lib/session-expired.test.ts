import { beforeEach, describe, expect, it } from 'vitest'
import { consumeSessionExpired, isAuthEndpoint, markSessionExpired } from './session-expired'

// Ambiente node: sessionStorage em memória
function memoryStorage(): Storage {
  const items = new Map<string, string>()
  return {
    get length() {
      return items.size
    },
    clear: () => items.clear(),
    getItem: (key) => items.get(key) ?? null,
    key: (index) => [...items.keys()][index] ?? null,
    removeItem: (key) => void items.delete(key),
    setItem: (key, value) => void items.set(key, value),
  }
}

describe('aviso de sessão expirada', () => {
  beforeEach(() => {
    globalThis.sessionStorage = memoryStorage()
  })

  it('aparece uma vez só', () => {
    expect(consumeSessionExpired()).toBe(false)
    markSessionExpired()
    expect(consumeSessionExpired()).toBe(true)
    expect(consumeSessionExpired()).toBe(false)
  })

  it('login e refresh não contam como sessão vencida', () => {
    expect(isAuthEndpoint('/auth/login')).toBe(true)
    expect(isAuthEndpoint('https://api.x.com/api/v1/auth/refresh')).toBe(true)
    expect(isAuthEndpoint('/auth/profile')).toBe(false)
    expect(isAuthEndpoint('/leads')).toBe(false)
    expect(isAuthEndpoint(undefined)).toBe(false)
  })
})
