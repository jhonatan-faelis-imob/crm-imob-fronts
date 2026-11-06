'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { ChevronLeft, ChevronRight, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { FormProvider, useForm, useWatch, type FieldErrors } from 'react-hook-form'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import type { Lead } from '@/types'
import { TabAddress } from './lead-form/tab-address'
import { TabBasicInfo, type BrokerOption } from './lead-form/tab-basic-info'
import { TabExtraData } from './lead-form/tab-extra-data'
import { TabPreponents } from './lead-form/tab-preponents'
import { leadToFormValues } from './lead-form/from-lead'
import { leadFormDefaultValues, leadFormSchema, type LeadFormValues } from './lead-form/schema'

// Each tab key matches its top-level section in leadFormSchema
const TABS = [
  { key: 'basic', label: 'Dados básicos' },
  { key: 'address', label: 'Endereço' },
  { key: 'extra', label: 'Dados extras' },
  { key: 'preponents', label: 'Preponentes' },
] as const

const navButtonClassName = 'size-11 rounded-[8px] border-[1.5px] border-neutral-200 text-neutral-600 sm:size-10'

// Owns the form state (useForm + activeTab). Mounted fresh via a `key` on the parent
// every time the dialog opens (or targets a different lead/tab), so state always starts
// correct without needing an effect to imperatively reset it on prop changes.
function LeadFormBody({
  lead,
  initialTab,
  brokers,
  onClose,
  onCancel,
  onDirtyChange,
  onSubmitLead,
}: {
  lead?: Lead
  initialTab: number
  brokers: BrokerOption[]
  onClose: () => void
  onCancel: () => void
  onDirtyChange: (isDirty: boolean) => void
  onSubmitLead: (data: LeadFormValues) => Promise<void>
}) {
  const [activeTab, setActiveTab] = useState(initialTab)

  const form = useForm<LeadFormValues>({
    resolver: zodResolver(leadFormSchema),
    mode: 'onChange',
    defaultValues: lead ? leadToFormValues(lead) : leadFormDefaultValues,
  })
  const { control, handleSubmit } = form
  const { isValid, isSubmitting, dirtyFields } = form.formState
  const canSave = isValid

  // dirtyFields compares field by field: isDirty would stay true after undoing an edit,
  // because the required selects report '' against an undefined default
  const hasChanges = Object.keys(dirtyFields).length > 0
  useEffect(() => {
    onDirtyChange(hasChanges)
  }, [hasChanges, onDirtyChange])

  // formState.errors only holds fields the user already changed, so a required field
  // that is still empty has to come from parsing the current values
  const values = useWatch({ control })
  const invalidSections = new Set(leadFormSchema.safeParse(values).error?.issues.map((issue) => issue.path[0]))
  const pendingTab = TABS.find((tab) => invalidSections.has(tab.key))

  let saveHint: string | undefined
  if (!canSave && pendingTab && pendingTab.key !== TABS[activeTab].key) {
    saveHint =
      pendingTab.key === 'basic'
        ? 'Preencha os campos obrigatórios na aba Dados básicos'
        : `Corrija os campos inválidos na aba ${pendingTab.label}`
  }

  async function onSubmit(data: LeadFormValues) {
    await onSubmitLead(data)
    onClose()
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
            onClick={() => setActiveTab(index)}
            className={`flex shrink-0 items-center gap-1.5 whitespace-nowrap border-b-2 px-3 py-2 text-sm font-medium transition-colors ${
              activeTab === index
                ? 'border-brand text-brand'
                : 'border-transparent text-neutral-400 hover:text-neutral-600'
            }`}
          >
            {index + 1}. {tab.label}
            {invalidSections.has(tab.key) && (
              <span className="h-2 w-2 rounded-full bg-danger">
                <span className="sr-only">Campos pendentes</span>
              </span>
            )}
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

      <DialogFooter className="mx-0 mb-0 shrink-0 flex-row items-center justify-between gap-2 rounded-b-2xl border-t-[0.5px] border-neutral-200 bg-white p-4 sm:justify-between sm:p-6">
        <Button
          type="button"
          variant="ghost"
          onClick={onCancel}
          disabled={isSubmitting}
          aria-label="Cancelar"
          className="h-11 min-w-11 rounded-[8px] border-[0.5px] border-neutral-200 px-3 text-neutral-600 sm:h-10"
        >
          <X className="min-[360px]:hidden" />
          <span className="hidden min-[360px]:inline">Cancelar</span>
        </Button>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={() => setActiveTab((prev) => prev - 1)}
            disabled={activeTab === 0}
            aria-label="Aba anterior"
            className={navButtonClassName}
          >
            <ChevronLeft />
          </Button>

          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={() => setActiveTab((prev) => prev + 1)}
            disabled={activeTab === TABS.length - 1}
            aria-label="Próxima aba"
            className={navButtonClassName}
          >
            <ChevronRight />
          </Button>

          {/* Disabled buttons fire no pointer events, so the tooltip hangs on a wrapper.
              The button stays outside <form> on purpose: a linked submit button would make
              Enter in any input (preponent form included) save the lead. */}
          <Tooltip disabled={!saveHint}>
            <TooltipTrigger
              delay={0}
              render={<span tabIndex={saveHint ? 0 : undefined} className={saveHint ? 'cursor-not-allowed rounded-[8px]' : undefined} />}
            >
              <Button
                type="button"
                onClick={handleSubmit(onSubmit, onInvalid)}
                disabled={!canSave || isSubmitting}
                className="h-11 rounded-[8px] bg-brand px-4 text-white hover:bg-brand-dark sm:h-10"
              >
                {isSubmitting ? 'Salvando...' : 'Salvar'}
              </Button>
            </TooltipTrigger>
            <TooltipContent>{saveHint}</TooltipContent>
          </Tooltip>
        </div>
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
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [isDiscardDialogOpen, setIsDiscardDialogOpen] = useState(false)

  // Also runs for the header X, Esc and backdrop click, not only the Cancelar button
  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen && hasUnsavedChanges) {
      setIsDiscardDialogOpen(true)
      return
    }
    onOpenChange(nextOpen)
  }

  function handleDiscard() {
    setIsDiscardDialogOpen(false)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
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
          brokers={brokers}
          onClose={() => onOpenChange(false)}
          onCancel={() => handleOpenChange(false)}
          onDirtyChange={setHasUnsavedChanges}
          onSubmitLead={onSubmitLead}
        />
      </DialogContent>

      <AlertDialog open={isDiscardDialogOpen} onOpenChange={setIsDiscardDialogOpen}>
        <AlertDialogContent className="w-[calc(100%-2rem)] gap-0 rounded-2xl border-[0.5px] border-neutral-200 bg-white p-0 ring-0">
          <AlertDialogHeader className="p-4 sm:p-6">
            <AlertDialogTitle>Descartar alterações?</AlertDialogTitle>
            <AlertDialogDescription>As alterações feitas neste lead serão perdidas.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mx-0 mb-0 flex-row justify-end gap-2 rounded-b-2xl border-t-[0.5px] border-neutral-200 bg-white p-4 sm:p-6">
            <AlertDialogCancel className="h-11 rounded-[8px] border-[1.5px] border-neutral-200 px-4 text-neutral-600 sm:h-10">
              Continuar editando
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDiscard}
              className="h-11 rounded-[8px] bg-danger px-4 text-white hover:bg-danger hover:opacity-90 sm:h-10"
            >
              Descartar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Dialog>
  )
}
