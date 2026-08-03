import type { FactoryOpts } from 'imask'

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
