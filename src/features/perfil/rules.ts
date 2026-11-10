import type { FactoryOpts } from 'imask'

/** Fixo (10 dígitos) ou celular (11), com DDD */
export const profilePhoneMask: FactoryOpts = {
  mask: [{ mask: '(00) 0000-0000' }, { mask: '(00) 00000-0000' }],
}

export function phoneDigits(value: string): string {
  return value.replace(/\D/g, '')
}

/** Vazio vale (limpa o telefone); preenchido precisa de 10 ou 11 dígitos */
export function isValidProfilePhone(value: string): boolean {
  const digits = phoneDigits(value)
  return digits.length === 0 || digits.length === 10 || digits.length === 11
}

export const MIN_PASSWORD_LENGTH = 8

export type PasswordStrength = { score: 0 | 1 | 2 | 3; label: string }

/** Indicador simples: tamanho e variedade de caracteres */
export function passwordStrength(password: string): PasswordStrength {
  if (password.length === 0) return { score: 0, label: '' }
  if (password.length < MIN_PASSWORD_LENGTH) return { score: 1, label: 'Fraca' }
  const kinds = [/[a-z]/, /[A-Z]/, /\d/, /[^A-Za-z0-9]/].filter((pattern) => pattern.test(password)).length
  if (password.length >= 12 && kinds >= 3) return { score: 3, label: 'Forte' }
  if (kinds >= 2) return { score: 2, label: 'Média' }
  return { score: 1, label: 'Fraca' }
}
