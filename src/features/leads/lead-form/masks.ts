import type { FactoryOpts } from 'imask'
import { IMask } from 'react-imask'

export const phoneMask: FactoryOpts = {
  mask: '(00) 00000-0000',
}

export const cpfMask: FactoryOpts = {
  mask: '000.000.000-00',
}

export const cepMask: FactoryOpts = {
  mask: '00000-000',
}

export const currencyMask: FactoryOpts = {
  mask: 'R$ num',
  blocks: {
    num: {
      mask: Number,
      thousandsSeparator: '.',
      radix: ',',
      scale: 2,
      padFractionalZeros: true,
      normalizeZeros: true,
      min: 0,
    },
  },
}

// IMaskInput reformats its value on mount and reports it through onChange, so a form
// default not already in this format would mark the field dirty as soon as it renders
export function applyMask(mask: FactoryOpts, value: string) {
  const masked = IMask.createMask(mask)
  masked.resolve(value)
  return masked.value
}
