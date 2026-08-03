'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { toast } from '@/components/ui/toast'
import { mapApiPropertyToProperty, type ApiProperty } from '@/features/empreendimentos/api'
import { mapApiTaskToTask, mapCompleteDataToDto, type ApiTask } from '@/features/tarefas/api'
import { CompleteTaskModal, type CompleteTaskData } from '@/features/tarefas/components/complete-task-modal'
import { interactionsService } from '@/services/interactions.service'
import { leadsService } from '@/services/leads.service'
import { propertiesService } from '@/services/properties.service'
import { tasksService } from '@/services/tasks.service'
import { usersService } from '@/services/users.service'
import type { Lead, Task, TaskType } from '@/types'
import { isLostStageName, mapFormValuesToCreateLeadDto, type ApiFunnelStage, type ApiLead } from '../../api-mapper'
import type { BrokerOption } from '../../lead-form/tab-basic-info'
import type { LeadFormValues } from '../../lead-form/schema'
import { NewLeadDialog } from '../../new-lead-dialog'
import { LostReasonModal } from '../lost-reason-modal'
import { AiAnalysisDialog } from './ai-analysis-dialog'
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
] as const

const tabTriggerClassName =
  'rounded-none border-transparent bg-transparent px-1 py-2.5 text-sm font-medium text-neutral-400 shadow-none after:bg-brand hover:text-neutral-600 data-active:border-transparent data-active:bg-transparent data-active:text-brand data-active:shadow-none'

export function LeadDetailPage({ lead, apiLead }: { lead: Lead; apiLead: ApiLead }) {
  const router = useRouter()
  const queryClient = useQueryClient()

  const [activeTab, setActiveTab] = useState<string>('timeline')
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editInitialTab, setEditInitialTab] = useState(0)
  const [isAiDialogOpen, setIsAiDialogOpen] = useState(false)
  const [isLostModalOpen, setIsLostModalOpen] = useState(false)
  const [isNewTaskDialogOpen, setIsNewTaskDialogOpen] = useState(false)
  const [completingTask, setCompletingTask] = useState<Task | null>(null)
  const [newTaskId, setNewTaskId] = useState<string | null>(null)

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

  const { data: incomeMatches } = useQuery<ApiProperty[]>({
    queryKey: ['properties', 'income-match', lead.income],
    queryFn: () => propertiesService.findByIncome(lead.income as number),
    enabled: lead.income !== undefined,
  })
  const linkedIds = new Set(linkedProperties.map((property) => property.id))
  const incomeMatchCount = incomeMatches?.length ?? 0
  const suggestions = (incomeMatches ?? [])
    .map(mapApiPropertyToProperty)
    .filter((property) => !linkedIds.has(property.id))
    .slice(0, 2)

  function invalidateLead() {
    queryClient.invalidateQueries({ queryKey: ['lead', lead.id] })
    queryClient.invalidateQueries({ queryKey: ['leads'] })
  }

  function invalidateTasks() {
    queryClient.invalidateQueries({ queryKey: ['tasks'] })
    queryClient.invalidateQueries({ queryKey: ['tasks-summary'] })
    queryClient.invalidateQueries({ queryKey: ['lead', lead.id] })
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

  const markAsLost = useMutation({
    mutationFn: (lostReason: string) => leadsService.markAsLost(lead.id, lostReason),
    onSuccess: () => {
      invalidateLead()
      toast.add({ title: 'Lead marcado como perdido', type: 'success' })
    },
    onError: () => {
      toast.add({ title: 'Não foi possível marcar o lead como perdido', type: 'error' })
    },
  })

  const updateStage = useMutation({
    mutationFn: (stage: ApiFunnelStage) => leadsService.updateStage(lead.id, stage.id),
    onMutate: async (stage) => {
      await queryClient.cancelQueries({ queryKey: ['lead', lead.id] })
      const previous = queryClient.getQueryData<ApiLead>(['lead', lead.id])
      queryClient.setQueryData<ApiLead>(['lead', lead.id], (old) =>
        old ? { ...old, funnelStageId: stage.id, funnelStage: stage } : old,
      )
      return { previous }
    },
    onError: (_error, _stage, context) => {
      if (context?.previous) queryClient.setQueryData(['lead', lead.id], context.previous)
      toast.add({ title: 'Não foi possível atualizar a etapa', type: 'error' })
    },
    onSuccess: (_data, stage) => {
      toast.add({ title: `Etapa atualizada para ${stage.name}`, type: 'success' })
    },
    onSettled: () => {
      invalidateLead()
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

  function handleMarkAsLost() {
    setIsLostModalOpen(true)
  }

  function handleSelectStage(stage: ApiFunnelStage) {
    if (isLostStageName(stage.name)) {
      setIsLostModalOpen(true)
      return
    }
    updateStage.mutate(stage)
  }

  function handleConfirmLostReason(reason: string) {
    markAsLost.mutate(reason, { onSuccess: () => setIsLostModalOpen(false) })
  }

  function openEdit(tabIndex = 0) {
    setEditInitialTab(tabIndex)
    setIsEditDialogOpen(true)
  }

  function handleCreateTask(data: NewTaskFormValues) {
    createTask.mutate({
      leadId: lead.id,
      assignedTo: lead.ownerId,
      title: data.title,
      type: data.type,
      priority: data.priority,
      dueDate: new Date(data.dueDate).toISOString(),
      hasNextTask: false,
    })
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
        onMarkAsLost={handleMarkAsLost}
        onArchive={() => archiveLead.mutate()}
        onSelectStage={handleSelectStage}
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
                  onOpenNewTask={() => setIsNewTaskDialogOpen(true)}
                  onCompleteRequest={setCompletingTask}
                  onDelete={(id) => cancelTask.mutate(id)}
                />
              )}
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
          <FinancialCard lead={lead} matchCount={incomeMatchCount} onViewLinkedProperties={() => setActiveTab('imoveis')} />
          <ResponsibleCard lead={lead} onTransfer={() => console.log('Transferir corretor', lead.id)} />
          <NextTaskCard
            tasks={tasks}
            onComplete={setCompletingTask}
            onScheduleNew={() => setIsNewTaskDialogOpen(true)}
          />
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
      <AiAnalysisDialog open={isAiDialogOpen} onOpenChange={setIsAiDialogOpen} leadId={lead.id} />
      <LostReasonModal
        open={isLostModalOpen}
        onOpenChange={setIsLostModalOpen}
        onConfirm={handleConfirmLostReason}
        isSubmitting={markAsLost.isPending}
      />
      <NewTaskDialog open={isNewTaskDialogOpen} onOpenChange={setIsNewTaskDialogOpen} onCreate={handleCreateTask} />
      <CompleteTaskModal
        task={completingTask}
        open={completingTask !== null}
        onClose={() => setCompletingTask(null)}
        onConfirm={handleConfirmComplete}
      />
    </div>
  )
}
