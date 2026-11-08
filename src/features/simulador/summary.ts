import { formatCurrency } from '@/lib/utils'
import type { SimulationResponse } from '@/services/simulations.service'

const LEAD_GREETING = '{{saudacao}}, {{primeiro_nome}}!'

// Com lead, as variáveis são preenchidas pelo render-free; sem lead, vai uma saudação neutra
export function simulationSummary(result: SimulationResponse, withLead: boolean) {
  const greeting = withLead ? LEAD_GREETING : 'Olá!'
  return [
    `${greeting} Fiz uma simulação inicial com as informações que você me passou:`,
    '',
    `• Parcela estimada: ${formatCurrency(result.installment)}`,
    `• Financiamento estimado: ${formatCurrency(result.financing)}`,
    `• Imóveis de até ${formatCurrency(result.maxPurchaseValue)}`,
    `• Entrada a complementar: ${formatCurrency(result.downPayment.remaining)}`,
    '',
    'É uma estimativa, sujeita à análise de crédito. Posso te mostrar as opções que cabem? 😊',
  ].join('\n')
}
