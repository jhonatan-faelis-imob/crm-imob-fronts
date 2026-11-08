'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { ChevronLeft, ChevronRight, X } from 'lucide-react'
import { useState } from 'react'
import { FormProvider, useForm, useWatch } from 'react-hook-form'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { useDebouncedValue } from '@/lib/use-debounced-value'
import { propertiesService } from '@/services/properties.service'
import type { Property } from '@/types'
import type { PortalReadinessDraft, PortalReadinessKey } from './portal/types'
import { findPortalType, usePortalConfig } from './portal/use-portal-config'
import {
  FIELD_TAB,
  READINESS_FIELD,
  READINESS_TAB,
  RESALE_TABS,
  propertyToResaleValues,
  resaleDefaultValues,
  resaleFormSchema,
  resaleFormToDto,
  resaleReadinessDraft,
  resaleSaveBlocker,
  type ResaleFieldName,
  type ResaleFormValues,
} from './resale-form/form'
import { TabAddress, TabBasic, TabFeatures, TabPortal } from './resale-form/tabs'

const navButtonClassName = 'size-11 rounded-[8px] border-[1.5px] border-neutral-200 text-neutral-600 sm:size-10'

// Dono do estado do formulário; o pai remonta com `key` a cada imóvel aberto
function ResaleForm({
  property,
  initialTab,
  brokers,
  onCancel,
  onSaved,
  onSubmitProperty,
}: {
  property?: Property
  initialTab: number
  brokers: { id: string; name: string }[]
  onCancel: () => void
  onSaved: () => void
  onSubmitProperty: (dto: Record<string, unknown>) => Promise<void>
}) {
  const [activeTab, setActiveTab] = useState(initialTab)
  const { data: config } = usePortalConfig()

  const form = useForm<ResaleFormValues>({
    resolver: zodResolver(resaleFormSchema),
    mode: 'onChange',
    defaultValues: property ? propertyToResaleValues(property) : resaleDefaultValues,
  })
  const { control, handleSubmit, setFocus } = form
  const { isSubmitting } = form.formState

  const values: ResaleFormValues = { ...resaleDefaultValues, ...useWatch({ control }) }
  const type = findPortalType(config, values.propertyType)

  // Checklist ao vivo: avalia o rascunho na API (500 ms depois da última digitação), sem o loading global
  const draftKey = useDebouncedValue(JSON.stringify(resaleReadinessDraft(values, type)), 500)
  const { data: readiness } = useQuery({
    queryKey: ['portal-readiness', draftKey],
    queryFn: () => propertiesService.checkReadiness(JSON.parse(draftKey) as PortalReadinessDraft),
    placeholderData: keepPreviousData,
    staleTime: 60_000,
    meta: { silent: true },
  })

  // Pendências por aba: erros de formato (zod) + itens do checklist que faltam
  const pendingTabs = new Set<number>()
  for (const issue of resaleFormSchema.safeParse(values).error?.issues ?? []) {
    const field = issue.path[0]
    if (typeof field === 'string' && field in FIELD_TAB) pendingTabs.add(FIELD_TAB[field as ResaleFieldName])
  }
  for (const item of readiness?.items ?? []) {
    if (item.ok === false) pendingTabs.add(READINESS_TAB[item.key])
  }

  const blocker =
    resaleSaveBlocker(values) ??
    (values.publishToPortals && readiness && !readiness.ready
      ? { message: 'Complete o checklist ou desligue “Publicar nos portais”', tab: 3 }
      : null)
  const canSave = blocker === null && !isSubmitting

  function goTo(key: PortalReadinessKey) {
    setActiveTab(READINESS_TAB[key])
    const field = READINESS_FIELD[key]
    // Espera a aba montar para focar o campo
    if (field) window.setTimeout(() => setFocus(field), 50)
  }

  async function onSubmit(data: ResaleFormValues) {
    await onSubmitProperty(resaleFormToDto(data, config))
    onSaved()
  }

  function onInvalid() {
    const firstIssue = resaleFormSchema.safeParse(form.getValues()).error?.issues[0]?.path[0]
    if (typeof firstIssue === 'string' && firstIssue in FIELD_TAB) setActiveTab(FIELD_TAB[firstIssue as ResaleFieldName])
  }

  return (
    <>
      <div className="flex shrink-0 gap-1 overflow-x-auto border-b-[0.5px] border-neutral-200 px-4 sm:px-6">
        {RESALE_TABS.map((tab, index) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActiveTab(index)}
            className={`flex min-h-11 shrink-0 items-center gap-1.5 whitespace-nowrap border-b-2 px-3 py-2 text-sm font-medium transition-colors ${
              activeTab === index ? 'border-brand text-brand' : 'border-transparent text-neutral-400 hover:text-neutral-600'
            }`}
          >
            {index + 1}. {tab.label}
            {pendingTabs.has(index) && (
              <span className="h-2 w-2 rounded-full bg-danger">
                <span className="sr-only">Pendências</span>
              </span>
            )}
          </button>
        ))}
      </div>

      <FormProvider {...form}>
        <form onSubmit={handleSubmit(onSubmit, onInvalid)} noValidate className="flex-1 overflow-y-auto p-4 sm:p-6">
          {activeTab === 0 && <TabBasic config={config} brokers={brokers} />}
          {activeTab === 1 && <TabAddress />}
          {activeTab === 2 && <TabFeatures config={config} type={type} />}
          {activeTab === 3 && <TabPortal config={config} type={type} readiness={readiness} onGoTo={goTo} />}
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
            disabled={activeTab === RESALE_TABS.length - 1}
            aria-label="Próxima aba"
            className={navButtonClassName}
          >
            <ChevronRight />
          </Button>

          {/* Botão desabilitado não recebe ponteiro: o tooltip fica num wrapper. Fora do <form> de propósito,
              para Enter num campo não salvar */}
          <Tooltip disabled={!blocker}>
            <TooltipTrigger
              delay={0}
              render={<span tabIndex={blocker ? 0 : undefined} className={blocker ? 'cursor-not-allowed rounded-[8px]' : undefined} />}
            >
              <Button
                type="button"
                onClick={handleSubmit(onSubmit, onInvalid)}
                disabled={!canSave}
                className="h-11 rounded-[8px] bg-brand px-4 text-white hover:bg-brand-dark sm:h-10"
              >
                {isSubmitting ? 'Salvando...' : 'Salvar'}
              </Button>
            </TooltipTrigger>
            <TooltipContent>{blocker?.message}</TooltipContent>
          </Tooltip>
        </div>
      </DialogFooter>
    </>
  )
}

export function NewPropertyDialog({
  open,
  onOpenChange,
  property,
  initialTab = 0,
  onSubmitProperty,
  brokers,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  property?: Property
  /** 3 = "Descrição e portais" (chip do card) */
  initialTab?: number
  onSubmitProperty: (dto: Record<string, unknown>) => Promise<void>
  brokers: { id: string; name: string }[]
}) {
  const isEditing = property !== undefined

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="grid-cols-none flex max-h-[90vh] w-[calc(100%-2rem)] max-w-2xl flex-col gap-0 rounded-2xl border-[0.5px] border-neutral-200 bg-white p-0 ring-0 sm:max-w-2xl">
        <DialogHeader className="shrink-0 gap-1 p-4 pr-12 sm:p-6 sm:pr-14">
          <DialogTitle>{isEditing ? 'Editar imóvel' : 'Novo imóvel (revenda)'}</DialogTitle>
          <DialogDescription>
            Só tipo, título, cidade e valor são obrigatórios. O resto prepara o anúncio para os portais.
          </DialogDescription>
        </DialogHeader>
        {open && (
          <ResaleForm
            property={property}
            initialTab={initialTab}
            brokers={brokers}
            onCancel={() => onOpenChange(false)}
            onSaved={() => onOpenChange(false)}
            onSubmitProperty={onSubmitProperty}
          />
        )}
      </DialogContent>
    </Dialog>
  )
}
