import type { DefaultValues } from 'react-hook-form'
import type { Lead } from '@/types'
import type { LeadFormValues } from './schema'

function toCurrencyMaskValue(value: number | undefined) {
  if (value === undefined) return ''
  return `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function isoToDDMMYYYY(iso: string | undefined) {
  if (!iso) return ''
  const date = new Date(iso)
  const day = String(date.getDate()).padStart(2, '0')
  const month = String(date.getMonth() + 1).padStart(2, '0')
  return `${day}/${month}/${date.getFullYear()}`
}

// Lead.spouseName/spousePhone/spouseIncome/spouseCpf are flat legacy fields with no
// relation/gender/address info, so they can't be reconstructed into a PreponentFormValues
// entry — editing starts with an empty preponents list even if the lead has spouse data.
export function leadToFormValues(lead: Lead): DefaultValues<LeadFormValues> {
  return {
    basic: {
      personType: 'fisica',
      source: lead.source,
      name: lead.name,
      maritalStatus: lead.maritalStatus ?? '',
      cpf: lead.cpf ?? '',
      phone: lead.phone,
      phone2: lead.phone2 ?? '',
      income: toCurrencyMaskValue(lead.income),
      interestValue: toCurrencyMaskValue(lead.interestValue),
      fgtsValue: toCurrencyMaskValue(lead.fgtsValue),
      ownResources: toCurrencyMaskValue(lead.ownResources),
      hasClt3Years: lead.hasClt3Years ?? false,
      email: lead.email ?? '',
      intent: lead.intent,
      urgency: lead.urgency ?? '',
      propertyType: lead.propertyType ?? '',
      tags: (lead.tags ?? []).map((tag) => tag.label),
      notes: lead.notes ?? '',
      isInvestor: false,
      isInterested: lead.profile === 'interessado',
      isOwner: lead.profile === 'proprietario',
      capturedByBrokerId: '',
      responsibleBrokerId: lead.ownerId,
    },
    address: {
      cep: lead.addressCep ?? '',
      street: lead.addressStreet ?? '',
      number: lead.addressNumber ?? '',
      complement: lead.addressComplement ?? '',
      neighborhood: lead.addressNeighborhood ?? '',
      city: lead.addressCity ?? '',
      state: lead.addressState ?? '',
    },
    extra: {
      pis: lead.pis ?? '',
      birthplace: lead.birthplace ?? '',
      rg: lead.rg ?? '',
      rgIssueDate: '',
      incomeForAnalysis: '',
      birthDate: isoToDDMMYYYY(lead.birthDate),
      occupation: lead.occupation ?? '',
      fatherName: lead.fatherName ?? '',
      motherName: lead.motherName ?? '',
    },
    preponents: [],
  }
}
