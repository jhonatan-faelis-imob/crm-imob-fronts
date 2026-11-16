import type { Metadata } from 'next'
import { LegalDocument } from '@/components/legal/legal-document'
import { privacidade } from '@/content/privacidade'

export const metadata: Metadata = {
  title: 'Política de Privacidade · Smart CRM',
  description: privacidade.description,
}

export default function PrivacidadePage() {
  return <LegalDocument doc={privacidade} current="privacidade" />
}
