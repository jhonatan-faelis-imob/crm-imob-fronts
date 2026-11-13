const SALES_MESSAGE = 'Quero conhecer o Smart CRM'

function salesWhatsapp() {
  const phone = (process.env.NEXT_PUBLIC_SALES_WHATSAPP ?? '').replace(/\D/g, '')
  const text = encodeURIComponent(SALES_MESSAGE)
  return phone ? `https://wa.me/${phone}?text=${text}` : `https://wa.me/?text=${text}`
}

export const LINKS = {
  login: '/login',
  signup: '/cadastro',
  sales: salesWhatsapp(),
  terms: '#',
  privacy: '#',
  about: '#produto',
  contact: salesWhatsapp(),
} as const

export const SECTION_LINKS = [
  { href: '#produto', label: 'Produto' },
  { href: '#ia', label: 'IA' },
  { href: '#metas', label: 'Metas' },
  { href: '#planos', label: 'Planos e preços' },
  { href: '#faq', label: 'Dúvidas' },
] as const
