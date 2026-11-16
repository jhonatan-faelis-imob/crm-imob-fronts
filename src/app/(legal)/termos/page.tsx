import type { Metadata } from 'next'
import { LegalDocument } from '@/components/legal/legal-document'
import { termos } from '@/content/termos'

export const metadata: Metadata = {
  title: 'Termos de Uso · Smart CRM',
  description: termos.description,
}

export default function TermosPage() {
  return <LegalDocument doc={termos} current="termos" />
}
