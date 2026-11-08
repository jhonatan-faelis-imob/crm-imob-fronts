'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { toast } from '@/components/ui/toast'
import { DocumentsCard } from '@/features/documentos/components/documents-card'
import { SimulatorDialog } from '@/features/simulador/components/simulator-dialog'
import { DocumentsTab } from '@/features/documentos/components/documents-tab'
import { mapApiPropertyToProperty, type ApiProperty } from '@/features/empreendimentos/api'
import { mapApiTaskToTask, mapCompleteDataToDto, type ApiTask } from '@/features/tarefas/api'
import { invalidateMyDayQueries } from '@/features/meu-dia/invalidate-my-day-queries'
import { CompleteTaskModal, type CompleteTaskData } from '@/features/tarefas/components/complete-task-modal'
import { TaskDetailSheet } from '@/features/tarefas/components/task-detail-sheet'
import { documentsService } from '@/services/documents.service'
import { interactionsService } from '@/services/interactions.service'
import { leadsService } from '@/services/leads.service'
import { propertiesService } from '@/services/properties.service'
import { simulationsService } from '@/services/simulations.service'
import { tasksService } from '@/services/tasks.service'
import { usersService } from '@/services/users.service'
import type { Lead, LeadChecklist, LeadDocsSummary, Task, TaskType } from '@/types'
import { mapFormValuesToCreateLeadDto, type ApiLead } from '../../api-mapper'
import type { BrokerOption } from '../../lead-form/tab-basic-info'
import type { LeadFormValues } from '../../lead-form/schema'
import { NewLeadDialog } from '../../new-lead-dialog'
import { useMoveLeadToStage } from '../../use-move-lead-to-stage'
import { AiAnalysisDialog } from './ai-analysis-dialog'
import { CadenceCard } from './cadence-card'
import {
  interactionToTimelineEntry,
  mapApiInteractionToInteraction,
  mapApiLeadPropertiesToProperties,
} from './api'
import { DetailHeader } from './detail-header'
import { LinkedPropertiesTab } from './linked-properties-tab'
import { NewTaskDialog, type NewTaskFormValues } from './new-task-dialog'
import { RegistrationDataTab } from './registration-data-tab'
import { FinancialCard, NextTaskCard, ResponsibleCard, SummaryCard } from './sidebar-cards'
import { TasksTab } from './tasks-tab'
import { TimelineTab } from './timeline-tab'

const TABS = [
  { value: 'timeline', label: 'Timeline' },
  { value: 'dados', label: 'Dados cadastrais' },
  { value: 'tarefas', label: 'Tarefas' },
  { value: 'imoveis', label: 'Imóveis vinculados' },
  { value: 'documentos', label: 'Documentos' },
] as const

const tabTriggerClassName =
  'rounded-none border-transparent bg-transparent px-1 py-2.5 text-sm font-medium text-neutral-400 shadow-none after:bg-brand hover:text-neutral-600 data-active:border-transparent data-active:bg-transparent data-active:text-brand data-active:shadow-none'

export function LeadDetailPage({ lead, apiLead }: { lead: Lead; apiLead: ApiLead }) {
  const router = useRouter()
  const queryClient = useQueryClient()
  const { moveLead, markLost } = useMoveLeadToStage()

  const [activeTab, setActiveTab] = useState<string>('timeline')
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editInitialTab, setEditInitialTab] = useState(0)
  const [isAiDialogOpen, setIsAiDialogOpen] = useState(false)
  const [isNewTaskDialogOpen, setIsNewTaskDialogOpen] = useState(false)
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [completingTask, setCompletingTask] = useState<Task | null>(null)
  const [openingTask, setOpeningTask] = useState<Task | null>(null)
  const [newTaskId, setNewTaskId] = useState<string | null>(null)
  const [isSimulatorOpen, setIsSimulatorOpen] = useState(false)

  const { data: brokers } = useQuery<BrokerOption[]>({
    queryKey: ['users'],
    queryFn: () => usersService.findAll(),
  })
  const brokerOptions = (brokers ?? []).filter((user) => user.role !== 'administrativo')

  // Timeline e imóveis vinculados já vêm embutidos na resposta de GET /leads/:id — sem
  // necessidade de outra requisição.
  const timelineEntries = (apiLead.interactions ?? [])
    .map(mapApiInteractionToInteraction)
    .map(interactionToTimelineEntry)
  const linkedProperties = mapApiLeadPropertiesToProperties(apiLead.properties ?? [])

  const { data: tasksData, isLoading: isTasksLoading } = useQuery<{ data: ApiTask[] }>({
    queryKey: ['tasks', 'lead', lead.id],
    queryFn: () => tasksService.findAll({ leadId: lead.id, limit: '100' }),
  })
  const tasks = (tasksData?.data ?? []).map(mapApiTaskToTask)

  // Só lê o cache: quem busca (e gera o checklist) é a aba Documentos, ao abrir
  const { data: checklist } = useQuery<LeadChecklist>({
    queryKey: ['lead-docs', lead.id],
    queryFn: () => documentsService.getChecklist(lead.id),
    enabled: false,
  })
  const docs: LeadDocsSummary | null = checklist
    ? {
        requiredTotal: checklist.summary.requiredTotal,
        requiredApproved: checklist.summary.requiredApproved,
        received: checklist.summary.counts.recebido,
        pendingRequired: checklist.summary.pendingRequired,
      }
    : (apiLead.docs ?? null)

  const { data: incomeMatches } = useQuery<ApiProperty[]>({
    queryKey: ['properties', 'income-match', lead.income],
    queryFn: () => propertiesService.findByIncome(lead.income as number),
    enabled: lead.income !== undefined,
  })
  const linkedIds = new Set(linkedProperties.map((property) => property.id))

  // Linha "Imóvel de referência" do card Financeiro: silenciosa, sem imóveis, só com renda
  const { data: referenceSimulation } = useQuery({
    queryKey: ['simulation', 'lead-reference', lead.id, lead.income, lead.fgtsValue, lead.ownResources, lead.hasClt3Years],
    queryFn: () =>
      simulationsService.calculate({
        income: lead.income ?? 0,
        fgts: lead.fgtsValue ?? 0,
        ownResources: lead.ownResources ?? 0,
        hasClt3Years: lead.hasClt3Years,
        includeProperties: false,
      }),
    enabled: (lead.income ?? 0) > 0,
    staleTime: 5 * 60 * 1000,
    meta: { silent: true },
  })
  const incomeMatchCount = incomeMatches?.length ?? 0
  const suggestions = (incomeMatches ?? [])
    .map(mapApiPropertyToProperty)
    .filter((property) => !linkedIds.has(property.id))
    .slice(0, 2)

  function invalidateLead() {
    invalidateMyDayQueries(queryClient, lead.id)
  }

  function invalidateTasks() {
    invalidateMyDayQueries(queryClient, lead.id)
  }

  const updateLead = useMutation({
    mutationFn: (dto: Record<string, unknown>) => leadsService.update(lead.id, dto),
    onSuccess: () => {
      invalidateLead()
      toast.add({ title: 'Lead atualizado com sucesso!', type: 'success' })
    },
    onError: () => {
      toast.add({ title: 'Não foi possível salvar as alterações', type: 'error' })
    },
  })

  const archiveLead = useMutation({
    mutationFn: () => leadsService.archive(lead.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] })
      toast.add({ title: 'Lead arquivado', type: 'success' })
      router.push('/leads')
    },
    onError: () => {
      toast.add({ title: 'Não foi possível arquivar o lead', type: 'error' })
    },
  })

  const createInteraction = useMutation({
    mutationFn: (dto: Record<string, unknown>) => interactionsService.create(dto),
    onSuccess: () => invalidateLead(),
    onError: () => {
      toast.add({ title: 'Não foi possível registrar a interação', type: 'error' })
    },
  })

  const deleteInteraction = useMutation({
    mutationFn: (id: string) => interactionsService.remove(id),
    onSuccess: () => invalidateLead(),
    onError: () => {
      toast.add({ title: 'Não foi possível excluir a interação', type: 'error' })
    },
  })

  const createTask = useMutation({
    mutationFn: (dto: Record<string, unknown>) => tasksService.create(dto),
    onSuccess: (created: ApiTask) => {
      invalidateTasks()
      setNewTaskId(created.id)
      setTimeout(() => setNewTaskId((current) => (current === created.id ? null : current)), 2000)
    },
    onError: () => {
      toast.add({ title: 'Não foi possível criar a tarefa', type: 'error' })
    },
  })

  const updateTask = useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: Record<string, unknown> }) => tasksService.update(id, dto),
    onSuccess: () => {
      invalidateTasks()
      toast.add({ title: 'Tarefa atualizada com sucesso!', type: 'success' })
    },
    onError: () => {
      toast.add({ title: 'Não foi possível salvar as alterações', type: 'error' })
    },
  })

  const completeTask = useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: Record<string, unknown> }) => tasksService.complete(id, dto),
    onSuccess: () => {
      invalidateTasks()
      toast.add({ title: 'Tarefa concluída!', type: 'success' })
    },
    onError: () => {
      toast.add({ title: 'Não foi possível concluir a tarefa', type: 'error' })
    },
  })

  const cancelTask = useMutation({
    mutationFn: (id: string) => tasksService.cancel(id),
    onSuccess: () => {
      invalidateTasks()
      toast.add({ title: 'Tarefa cancelada', type: 'success' })
    },
    onError: () => {
      toast.add({ title: 'Não foi possível cancelar a tarefa', type: 'error' })
    },
  })

  const linkProperty = useMutation({
    mutationFn: (propertyId: string) => propertiesService.linkLead(propertyId, lead.id),
    onSuccess: () => {
      invalidateLead()
      toast.add({ title: 'Imóvel vinculado', type: 'success' })
    },
    onError: () => {
      toast.add({ title: 'Não foi possível vincular o imóvel', type: 'error' })
    },
  })

  const unlinkProperty = useMutation({
    mutationFn: (propertyId: string) => propertiesService.unlinkLead(propertyId, lead.id),
    onSuccess: () => {
      invalidateLead()
      toast.add({ title: 'Imóvel desvinculado', type: 'success' })
    },
    onError: () => {
      toast.add({ title: 'Não foi possível desvincular o imóvel', type: 'error' })
    },
  })

  async function handleSubmitLead(data: LeadFormValues) {
    await updateLead.mutateAsync(mapFormValuesToCreateLeadDto(data))
  }

  function openEdit(tabIndex = 0) {
    setEditInitialTab(tabIndex)
    setIsEditDialogOpen(true)
  }

  function openNewTaskDialog() {
    setEditingTask(null)
    setIsNewTaskDialogOpen(true)
  }

  function openEditTaskDialog(task: Task) {
    setEditingTask(task)
    setIsNewTaskDialogOpen(true)
  }

  function handleSaveTask(data: NewTaskFormValues, taskId?: string) {
    const dto = {
      title: data.title,
      description: data.description || undefined,
      type: data.type,
      priority: data.priority,
      dueDate: new Date(data.dueDate).toISOString(),
    }
    if (taskId) {
      updateTask.mutate({ id: taskId, dto })
    } else {
      createTask.mutate({ ...dto, leadId: lead.id, assignedTo: lead.ownerId, hasNextTask: false })
    }
  }

  function handleConfirmComplete(data: CompleteTaskData) {
    if (!completingTask) return
    completeTask.mutate({ id: completingTask.id, dto: mapCompleteDataToDto(data) })
    setCompletingTask(null)
  }

  function handleCreateInteraction(data: { type: TaskType; notes: string }) {
    createInteraction.mutate({ leadId: lead.id, type: data.type, notes: data.notes })
  }

  return (
    <div className="space-y-6">
      <DetailHeader
        lead={lead}
        onEdit={() => openEdit(0)}
        onTransfer={() => console.log('Transferir corretor', lead.id)}
        onMarkAsLost={() => markLost(lead)}
        onArchive={() => archiveLead.mutate()}
        onSelectStage={(stage) => moveLead(lead, stage)}
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="order-2 lg:order-1 lg:col-span-2">
          <Tabs
            value={activeTab}
            onValueChange={(value) => {
              if (typeof value === 'string') setActiveTab(value)
            }}
          >
            <TabsList
              variant="line"
              className="h-auto w-full justify-start gap-4 overflow-x-auto border-b-[0.5px] border-neutral-200 bg-transparent p-0"
            >
              {TABS.map((tab) => (
                <TabsTrigger key={tab.value} value={tab.value} className={tabTriggerClassName}>
                  {tab.label}
                  {tab.value === 'documentos' && docs && docs.requiredTotal > 0 && (
                    <span className="ml-1.5 rounded-full bg-neutral-100 px-1.5 py-0.5 text-[11px] font-medium text-neutral-600">
                      {docs.requiredApproved}/{docs.requiredTotal}
                    </span>
                  )}
                </TabsTrigger>
              ))}
            </TabsList>

            <TabsContent value="timeline" className="mt-4">
              <TimelineTab
                entries={timelineEntries}
                isSaving={createInteraction.isPending}
                onCreate={handleCreateInteraction}
                onDelete={(id) => deleteInteraction.mutate(id)}
              />
            </TabsContent>
            <TabsContent value="dados" className="mt-4">
              <RegistrationDataTab lead={lead} onEdit={openEdit} />
            </TabsContent>
            <TabsContent value="tarefas" className="mt-4">
              {isTasksLoading ? (
                <div className="space-y-3">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <Skeleton key={i} className="h-20 rounded-[16px]" />
                  ))}
                </div>
              ) : (
                <TasksTab
                  tasks={tasks}
                  newTaskId={newTaskId}
                  onOpenNewTask={openNewTaskDialog}
                  onCompleteRequest={setCompletingTask}
                  onDelete={(id) => cancelTask.mutate(id)}
                  onOpenDetail={setOpeningTask}
                />
              )}
            </TabsContent>
            <TabsContent value="documentos" className="mt-4">
              <DocumentsTab lead={lead} />
            </TabsContent>
            <TabsContent value="imoveis" className="mt-4">
              <LinkedPropertiesTab
                linkedProperties={linkedProperties}
                suggestions={suggestions}
                onLink={(property) => linkProperty.mutate(property.id)}
                onUnlink={(propertyId) => unlinkProperty.mutate(propertyId)}
              />
            </TabsContent>
          </Tabs>
        </div>

        <div className="order-1 space-y-4 lg:order-2 lg:col-span-1">
          <SummaryCard lead={lead} onAnalyze={() => setIsAiDialogOpen(true)} />
          <FinancialCard
            lead={lead}
            matchCount={incomeMatchCount}
            referenceValue={(lead.income ?? 0) > 0 ? referenceSimulation?.maxPurchaseValue : undefined}
            onViewLinkedProperties={() => setActiveTab('imoveis')}
            onSimulate={() => setIsSimulatorOpen(true)}
          />
          <ResponsibleCard lead={lead} onTransfer={() => console.log('Transferir corretor', lead.id)} />
          <NextTaskCard
            tasks={tasks}
            onComplete={setCompletingTask}
            onScheduleNew={openNewTaskDialog}
            onOpenDetail={setOpeningTask}
          />
          <CadenceCard leadId={lead.id} onOpenTask={setOpeningTask} onAddTask={openNewTaskDialog} />
          <DocumentsCard docs={docs} onOpen={() => setActiveTab('documentos')} />
        </div>
      </div>

      <NewLeadDialog
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        lead={lead}
        initialTab={editInitialTab}
        brokers={brokerOptions}
        onSubmitLead={handleSubmitLead}
      />
      <SimulatorDialog
        open={isSimulatorOpen}
        onOpenChange={setIsSimulatorOpen}
        lead={lead}
        linkedPropertyIds={linkedProperties.map((property) => property.id)}
      />
      <AiAnalysisDialog open={isAiDialogOpen} onOpenChange={setIsAiDialogOpen} leadId={lead.id} />
      <NewTaskDialog
        open={isNewTaskDialogOpen}
        onOpenChange={(next) => {
          setIsNewTaskDialogOpen(next)
          if (!next) setEditingTask(null)
        }}
        task={editingTask}
        onSave={handleSaveTask}
      />
      <CompleteTaskModal
        task={completingTask}
        open={completingTask !== null}
        onClose={() => setCompletingTask(null)}
        onConfirm={handleConfirmComplete}
      />
      <TaskDetailSheet
        task={openingTask}
        open={openingTask !== null}
        onOpenChange={(next) => !next && setOpeningTask(null)}
        onComplete={setCompletingTask}
        onEdit={openEditTaskDialog}
        onCancel={(id) => cancelTask.mutate(id)}
      />
    </div>
  )
}
