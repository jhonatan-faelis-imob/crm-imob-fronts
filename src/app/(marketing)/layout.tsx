import type { Metadata, Viewport } from 'next'
import { Plus_Jakarta_Sans } from 'next/font/google'

const jakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  display: 'swap',
})

const title = 'CRM Imob — CRM imobiliário com IA para lançamento e revenda'
const description =
  'Funil, follow-up, tarefas e metas num só lugar, com uma IA que pontua cada lead e mostra em quem investir seu tempo hoje. Feito para corretores e equipes de lançamento e revenda.'

export const metadata: Metadata = {
  title,
  description,
  openGraph: {
    type: 'website',
    locale: 'pt_BR',
    siteName: 'CRM Imob',
    title,
    description,
  },
  twitter: {
    card: 'summary',
    title,
    description,
  },
}

// A LP permite zoom (o viewport do app trava a escala)
export const viewport: Viewport = {
  themeColor: '#121212',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
}

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div data-landing className={`${jakarta.className} min-h-screen bg-white text-[#1C1B1A] antialiased`}>
      {children}
    </div>
  )
}
