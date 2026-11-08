import { acceptsLine, firstName, formatArea, formatMoney, greetingFor, saoPauloHour } from './share-format'

// Mensagem do WhatsApp ao compartilhar um imóvel. Pura e testável: mesma entrada, mesmo texto.
// Formatação do WhatsApp: *negrito*. Linhas sem dado são omitidas.

export interface ShareMessageInput {
  /** Nome do lead; sem lead a saudação é só "Olá!" */
  leadName?: string | null
  kind: 'revenda' | 'empreendimento'
  title: string
  /** Linha "🔖 Cód. X", omitida sem código */
  code?: string | null
  neighborhood?: string | null
  city?: string | null
  bedrooms?: number | null
  bathrooms?: number | null
  parkingSpots?: number | null
  /** Área útil ou, se não houver, a total */
  area?: number | null
  /** Revenda: price; empreendimento: startingPrice */
  price?: number | null
  showPrice: boolean
  acceptsFgts?: boolean | null
  acceptsFinancing?: boolean | null
  url: string
  /** Para testes: o horário define a saudação (fuso de São Paulo) */
  now?: Date
}

function count(value: number | null | undefined, emoji: string, singular: string, plural: string) {
  if (value === null || value === undefined || value <= 0) return null
  return `${emoji} ${value} ${value === 1 ? singular : plural}`
}

export function buildPropertyShareMessage(input: ShareMessageInput) {
  const name = input.leadName ? firstName(input.leadName) : ''
  const greeting = name ? `${greetingFor(saoPauloHour(input.now))}, ${name}! 😊` : 'Olá!'

  const place = [input.neighborhood, input.city].map((part) => part?.trim()).filter(Boolean).join(', ')
  const specs = [
    count(input.bedrooms, '🛏', 'quarto', 'quartos'),
    count(input.bathrooms, '🚿', 'banheiro', 'banheiros'),
    count(input.parkingSpots, '🚗', 'vaga', 'vagas'),
    input.area && input.area > 0 ? `📐 ${formatArea(input.area)}` : null,
  ].filter((item): item is string => item !== null)

  const price =
    input.showPrice && input.price && input.price > 0
      ? `💰 ${input.kind === 'empreendimento' ? 'a partir de ' : ''}${formatMoney(input.price)}`
      : null
  const accepts = acceptsLine(input.acceptsFgts, input.acceptsFinancing)

  const details = [
    `🏠 *${input.title.trim()}*`,
    input.code ? `🔖 Cód. ${input.code}` : null,
    place ? `📍 ${place}` : null,
    specs.length > 0 ? specs.join(' · ') : null,
    price,
    accepts ? `✅ ${accepts}` : null,
  ].filter((line): line is string => line !== null)

  return [
    greeting,
    'Separei um imóvel que combina com o que você procura:',
    '',
    ...details,
    '',
    `Veja os detalhes aqui: ${input.url}`,
    '',
    'Qualquer dúvida, estou à disposição!',
  ].join('\n')
}
