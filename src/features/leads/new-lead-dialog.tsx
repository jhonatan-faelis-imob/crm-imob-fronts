'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { FormProvider, useForm, type FieldErrors, type FieldPath } from 'react-hook-form'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import type { Lead } from '@/types'
import { TabAddress } from './lead-form/tab-address'
import { TabBasicInfo, type BrokerOption } from './lead-form/tab-basic-info'
import { TabExtraData } from './lead-form/tab-extra-data'
import { TabPreponents } from './lead-form/tab-preponents'
import { leadToFormValues } from './lead-form/from-lead'
import { leadFormDefaultValues, leadFormSchema, type LeadFormValues } from './lead-form/schema'

const TABS = [
  { key: 'basic', label: 'Dados básicos' },
  { key: 'address', label: 'Endereço' },
  { key: 'extra', label: 'Dados extras' },
  { key: 'preponents', label: 'Preponentes' },
] as const

const BASIC_INFO_FIELDS: FieldPath<LeadFormValues>[] = [
  'basic.personType',
  'basic.source',
  'basic.name',
  'basic.maritalStatus',
  'basic.cpf',
  'basic.phone',
  'basic.phone2',
  'basic.income',
  'basic.email',
  'basic.intent',
  'basic.urgency',
  'basic.propertyType',
  'basic.tags',
  'basic.notes',
  'basic.isInvestor',
  'basic.isInterested',
  'basic.isOwner',
  'basic.capturedByBrokerId',
  'basic.responsibleBrokerId',
]

// Owns the form state (useForm + activeTab). Mounted fresh via a `key` on the parent
// every time the dialog opens (or targets a different lead/tab), so state always starts
// correct without needing an effect to imperatively reset it on prop changes.
function LeadFormBody({
  lead,
  initialTab,
  isEditing,
  brokers,
  onClose,
  onSubmitLead,
}: {
  lead?: Lead
  initialTab: number
  isEditing: boolean
  brokers: BrokerOption[]
  onClose: () => void
  onSubmitLead: (data: LeadFormValues) => Promise<void>
}) {
  const [activeTab, setActiveTab] = useState(initialTab)
  const [isSaving, setIsSaving] = useState(false)

  const form = useForm<LeadFormValues>({
    resolver: zodResolver(leadFormSchema),
    defaultValues: lead ? leadToFormValues(lead) : leadFormDefaultValues,
  })
  const { handleSubmit, trigger } = form

  async function goToTab(index: number) {
    if (index === activeTab) return
    if (index > activeTab && activeTab === 0) {
      const isValid = await trigger(BASIC_INFO_FIELDS)
      if (!isValid) return
    }
    setActiveTab(index)
  }

  async function onSubmit(data: LeadFormValues) {
    try {
      setIsSaving(true)
      await onSubmitLead(data)
      onClose()
    } finally {
      setIsSaving(false)
    }
  }

  function onInvalid(formErrors: FieldErrors<LeadFormValues>) {
    if (formErrors.basic) setActiveTab(0)
    else if (formErrors.address) setActiveTab(1)
    else if (formErrors.extra) setActiveTab(2)
    else setActiveTab(3)
  }

  return (
    <>
      <div className="flex shrink-0 gap-1 overflow-x-auto border-b-[0.5px] border-neutral-200 px-4 sm:px-6">
        {TABS.map((tab, index) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => goToTab(index)}
            className={`shrink-0 whitespace-nowrap border-b-2 px-3 py-2 text-sm font-medium transition-colors ${
              activeTab === index
                ? 'border-brand text-brand'
                : 'border-transparent text-neutral-400 hover:text-neutral-600'
            }`}
          >
            {index + 1}. {tab.label}
          </button>
        ))}
      </div>

      <FormProvider {...form}>
        <form onSubmit={handleSubmit(onSubmit, onInvalid)} noValidate className="flex-1 overflow-y-auto p-4 sm:p-6">
          {activeTab === 0 && <TabBasicInfo brokers={brokers} />}
          {activeTab === 1 && <TabAddress />}
          {activeTab === 2 && <TabExtraData />}
          {activeTab === 3 && <TabPreponents />}
        </form>
      </FormProvider>

      <DialogFooter className="mx-0 mb-0 shrink-0 flex-row justify-between gap-2 rounded-b-2xl border-t-[0.5px] border-neutral-200 bg-white p-4 sm:p-6">
        <button
          type="button"
          onClick={() => goToTab(activeTab - 1)}
          disabled={activeTab === 0}
          className="rounded-[8px] border-[1.5px] border-neutral-200 px-4 py-2.5 text-sm font-medium text-neutral-600 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Anterior
        </button>

        {activeTab < TABS.length - 1 ? (
          <button
            type="button"
            onClick={() => goToTab(activeTab + 1)}
            className="rounded-[8px] bg-brand px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-brand-dark"
          >
            Próximo
          </button>
        ) : (
          <button
            type="button"
            onClick={handleSubmit(onSubmit, onInvalid)}
            disabled={isSaving}
            className="rounded-[8px] bg-brand px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isSaving ? 'Salvando...' : isEditing ? 'Salvar alterações' : 'Salvar lead'}
          </button>
        )}
      </DialogFooter>
    </>
  )
}

export function NewLeadDialog({
  open,
  onOpenChange,
  lead,
  initialTab = 0,
  brokers,
  onSubmitLead,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  lead?: Lead
  initialTab?: number
  brokers: BrokerOption[]
  onSubmitLead: (data: LeadFormValues) => Promise<void>
}) {
  const isEditing = lead !== undefined

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="grid-cols-none flex w-[calc(100%-2rem)] max-w-2xl flex-col gap-0 rounded-2xl border-[0.5px] border-neutral-200 bg-white p-0 ring-0 sm:max-w-2xl max-h-[90vh]">
        <DialogHeader className="shrink-0 gap-1 p-4 pr-12 sm:p-6 sm:pr-14 sm:pb-4">
          <DialogTitle>{lead ? `Editar lead — ${lead.name}` : 'Novo lead'}</DialogTitle>
          <DialogDescription>
            {isEditing ? 'Atualize os dados do lead.' : 'Cadastre um novo lead no funil de vendas.'}
          </DialogDescription>
        </DialogHeader>

        <LeadFormBody
          key={`${open}-${lead?.id ?? 'new'}-${initialTab}`}
          lead={lead}
          initialTab={initialTab}
          isEditing={isEditing}
          brokers={brokers}
          onClose={() => onOpenChange(false)}
          onSubmitLead={onSubmitLead}
        />
      </DialogContent>
    </Dialog>
  )
}
