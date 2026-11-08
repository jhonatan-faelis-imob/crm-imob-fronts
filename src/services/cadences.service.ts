import api from '@/lib/api'
import type { CadenceStage, CadenceStep, TaskPriority, TaskType } from '@/types'

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
}
