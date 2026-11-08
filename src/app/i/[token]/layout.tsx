import type { Viewport } from 'next'

// Página pública do imóvel: sem sidebar nem navegação do CRM. Permite zoom (o app trava a escala)
export const viewport: Viewport = {
  themeColor: '#FF385C',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
}

export default function PublicShareLayout({ children }: { children: React.ReactNode }) {
  return <div className="min-h-[100dvh] bg-[#F7F5F3]">{children}</div>
}
