import type { FactoryOpts } from 'imask'

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
