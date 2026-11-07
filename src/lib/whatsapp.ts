// Até 11 dígitos é DDD + número. Olhar só o prefixo erraria no DDD 55 (Santa Maria/RS)
function whatsappNumber(phone: string) {
  const clean = phone.replace(/\D/g, '')
  return clean.length > 11 ? clean : `55${clean}`
}

export function whatsappUrl(phone: string, text?: string) {
  const url = `https://wa.me/${whatsappNumber(phone)}`
  return text ? `${url}?text=${encodeURIComponent(text)}` : url
}
