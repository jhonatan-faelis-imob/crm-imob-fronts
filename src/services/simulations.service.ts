import api from '@/lib/api'

export interface SimulationParamsConfig {
  commitmentPct: number
  termFactor: number
  financingPct: number
}

export interface SimulationConfig {
  defaults: SimulationParamsConfig & { nearMarginPct: number }
  limits: {
    commitmentPct: { min: number; max: number }
    termFactor: { min: number; max: number }
    financingPct: { min: number; max: number }
    maxIncome: number
  }
  maxProperties: number
}

export interface SimulationRequest extends Partial<SimulationParamsConfig> {
  income: number
  spouseIncome?: number
  fgts?: number
  ownResources?: number
  subsidy?: number
  useFgts?: boolean
  hasClt3Years?: boolean
  includeProperties?: boolean
}

export interface SimulationProperty {
  id: string
  kind: 'empreendimento' | 'revenda'
  title: string
  city: string
  neighborhood: string | null
  propertyStatus: string | null
  referencePrice: number
  priceLabel: 'a partir de' | 'valor'
  fit: 'cabe' | 'quase'
  downNeeded: number
  downRemaining: number
  incomeMatch: boolean
}

export interface SimulationResponse {
  inputs: SimulationParamsConfig & {
    income: number
    spouseIncome: number
    fgts: number
    ownResources: number
    subsidy: number
    useFgts: boolean
    hasClt3Years: boolean | null
    nearMarginPct: number
    totalIncome: number
  }
  installment: number
  financing: number
  referenceValue: number
  maxPurchaseValue: number
  downPayment: {
    total: number
    fgts: number
    ownResources: number
    subsidy: number
    covered: number
    remaining: number
    surplus: number
  }
  warnings: { code: string; message: string }[]
  properties: { items: SimulationProperty[]; counts: { cabe: number; quase: number } }
}

export const simulationsService = {
  getConfig: async (): Promise<SimulationConfig> => {
    const { data } = await api.get<SimulationConfig>('/simulations/config')
    return data
  },
  calculate: async (request: SimulationRequest): Promise<SimulationResponse> => {
    const { data } = await api.post<SimulationResponse>('/simulations/calculate', request)
    return data
  },
}
