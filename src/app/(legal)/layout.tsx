import type { Viewport } from 'next'

// Páginas legais públicas: sem sidebar nem navegação do CRM. Permite zoom (o app trava a escala).
// Podem ser indexadas: não definir robots aqui.
export const viewport: Viewport = {
  themeColor: '#060B23',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
}

export default function LegalLayout({ children }: { children: React.ReactNode }) {
  return <div className="min-h-[100dvh] bg-[#F7F5F3]">{children}</div>
}
