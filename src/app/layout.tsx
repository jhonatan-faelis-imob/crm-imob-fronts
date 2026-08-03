import type { Metadata } from 'next'
import { Plus_Jakarta_Sans } from 'next/font/google'
import { Toaster } from '@/components/ui/toast'
import { Providers } from '@/components/providers'
import './globals.css'

const jakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-jakarta',
})

export const metadata: Metadata = {
  title: 'CRM Imob',
  description: 'CRM para imobiliárias',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR">
      <body className={jakarta.variable} suppressHydrationWarning>
        <Providers>
          <Toaster>{children}</Toaster>
        </Providers>
      </body>
    </html>
  )
}