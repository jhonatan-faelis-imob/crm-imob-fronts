import type { ApiTask } from '@/features/tarefas/api'
import api from '@/lib/api'
import type { CadenceStage, CadenceStep, TaskPriority, TaskType } from '@/types'

export interface LeadCadence {
  stage: { id: string; name: string; color: string } | null
  steps: CadenceStep[]
  tasks: ApiTask[]
}

export interface ApplyExistingPreview {
  leads: number
  tasksToCreate: number
}

export interface ApplyExistingResult extends ApplyExistingPreview {
  created: number
}

export interface CadenceStepDto {
  title: string
  description?: string
  type: TaskType
  priority: TaskPriority
  offsetDays: number
  dueTime: string
  skipWeekends: boolean
  active?: boolean
}

export const cadencesService = {
  findAll: async (): Promise<CadenceStage[]> => {
    const { data } = await api.get<CadenceStage[]>('/cadences')
    return data
  },
  createStep: async (dto: CadenceStepDto & { funnelStageId: string }): Promise<CadenceStep> => {
    const { data } = await api.post<CadenceStep>('/cadences/steps', dto)
    return data
  },
  updateStep: async (id: string, dto: Partial<CadenceStepDto>): Promise<CadenceStep> => {
    const { data } = await api.patch<CadenceStep>(`/cadences/steps/${id}`, dto)
    return data
  },
  removeStep: async (id: string) => {
    await api.delete(`/cadences/steps/${id}`)
  },
  reorderSteps: async (stageId: string, orderedIds: string[]): Promise<CadenceStep[]> => {
    const { data } = await api.patch<CadenceStep[]>('/cadences/steps/reorder', { stageId, orderedIds })
    return data
  },
  findForLead: async (leadId: string): Promise<LeadCadence> => {
    const { data } = await api.get<LeadCadence>(`/cadences/lead/${leadId}`)
    return data
  },
  reapplyForLead: async (leadId: string): Promise<{ created: { id: string; title: string }[] }> => {
    const { data } = await api.post<{ created: { id: string; title: string }[] }>(`/cadences/lead/${leadId}/reapply`)
    return data
  },
  previewApplyExisting: async (stageId: string): Promise<ApplyExistingPreview> => {
    const { data } = await api.post<ApplyExistingPreview>(`/cadences/stages/${stageId}/apply-existing`, { dryRun: true })
    return data
  },
  applyExisting: async (stageId: string): Promise<ApplyExistingResult> => {
    const { data } = await api.post<ApplyExistingResult>(`/cadences/stages/${stageId}/apply-existing`, { dryRun: false })
    return data
  },
}
