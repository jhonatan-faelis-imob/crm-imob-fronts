import { Pencil } from 'lucide-react'
import type { ReactNode } from 'react'
import { formatCurrency } from '@/lib/utils'
import type { Lead } from '@/types'
import { MARITAL_STATUS_META } from '../../lead-form/options'
import { formatDateBR } from './format'

function Section({
  title,
  onEdit,
  children,
}: {
  title: string
  onEdit: () => void
  children: ReactNode
}) {
  return (
    <div className="rounded-[16px] border-[0.5px] border-neutral-200 bg-white p-5">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-neutral-900">{title}</h3>
        <button
          type="button"
          onClick={onEdit}
          className="flex items-center gap-1 text-xs font-medium text-brand hover:text-brand-dark"
        >
          <Pencil className="h-3.5 w-3.5" />
          Editar
        </button>
      </div>
      <div className="mt-3 grid grid-cols-1 gap-x-6 gap-y-3 text-sm sm:grid-cols-2">{children}</div>
    </div>
  )
}

function Field({ label, value }: { label: string; value?: string | null }) {
  return (
    <div>
      <p className="text-xs text-neutral-400">{label}</p>
      <p className="mt-0.5 text-neutral-900">{value || '—'}</p>
    </div>
  )
}

function safeDate(iso: string | undefined) {
  return iso ? formatDateBR(iso) : undefined
}

export function RegistrationDataTab({ lead, onEdit }: { lead: Lead; onEdit: (tabIndex: number) => void }) {
  const hasSpouseData = Boolean(lead.spouseName || lead.spousePhone || lead.spouseCpf || lead.spouseIncome)

  return (
    <div className="space-y-4">
      <Section title="Dados pessoais" onEdit={() => onEdit(0)}>
        <Field label="Nome" value={lead.name} />
        <Field label="CPF" value={lead.cpf} />
        <Field label="RG" value={lead.rg} />
        <Field label="Data de nascimento" value={safeDate(lead.birthDate)} />
        <Field label="Estado civil" value={lead.maritalStatus ? MARITAL_STATUS_META[lead.maritalStatus] : undefined} />
        <Field label="Naturalidade" value={lead.birthplace} />
        <Field label="Profissão" value={lead.occupation} />
      </Section>

      <Section title="Contato" onEdit={() => onEdit(0)}>
        <Field label="Telefone principal" value={lead.phone} />
        <Field label="Telefone adicional" value={lead.phone2} />
        <Field label="E-mail" value={lead.email} />
      </Section>

      <Section title="Endereço" onEdit={() => onEdit(1)}>
        <Field label="CEP" value={lead.addressCep} />
        <Field
          label="Endereço"
          value={[lead.addressStreet, lead.addressNumber].filter(Boolean).join(', ') || undefined}
        />
        <Field label="Complemento" value={lead.addressComplement} />
        <Field label="Bairro" value={lead.addressNeighborhood} />
        <Field label="Cidade" value={lead.addressCity} />
        <Field label="Estado" value={lead.addressState} />
      </Section>

      <Section title="Dados financeiros" onEdit={() => onEdit(0)}>
        <Field label="Renda" value={lead.income !== undefined ? formatCurrency(lead.income) : undefined} />
        <Field label="CLT há 3 anos" value={lead.hasClt3Years === undefined ? undefined : lead.hasClt3Years ? 'Sim' : 'Não'} />
        <Field label="FGTS" value={lead.fgtsValue !== undefined ? formatCurrency(lead.fgtsValue) : undefined} />
        <Field label="Recursos próprios" value={lead.ownResources !== undefined ? formatCurrency(lead.ownResources) : undefined} />
      </Section>

      <Section title="Dados para contrato" onEdit={() => onEdit(2)}>
        <Field label="PIS" value={lead.pis} />
        <Field label="Nome do pai" value={lead.fatherName} />
        <Field label="Nome da mãe" value={lead.motherName} />
        <Field label="Naturalidade" value={lead.birthplace} />
      </Section>

      <Section title="Preponentes" onEdit={() => onEdit(3)}>
        {hasSpouseData ? (
          <>
            <Field label="Nome" value={lead.spouseName} />
            <Field label="CPF" value={lead.spouseCpf} />
            <Field label="Telefone" value={lead.spousePhone} />
            <Field
              label="Renda"
              value={lead.spouseIncome !== undefined ? formatCurrency(lead.spouseIncome) : undefined}
            />
          </>
        ) : (
          <p className="col-span-full text-sm text-neutral-400">Nenhum preponente cadastrado.</p>
        )}
      </Section>
    </div>
  )
}
