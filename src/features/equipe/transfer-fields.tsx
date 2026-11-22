import type { PortfolioSummary, TransferKind } from '@/services/users.service'
import { ROLE_META } from './constants'
import { inputClassName, labelClassName } from './field'
import type { Member } from './types'

const KIND_LABEL: Record<TransferKind, (summary: PortfolioSummary) => string> = {
  leads: (summary) => `${summary.leadsAtivos} ${summary.leadsAtivos === 1 ? 'lead ativo' : 'leads ativos'}`,
  tasks: (summary) => `${summary.tarefasPendentes} ${summary.tarefasPendentes === 1 ? 'tarefa pendente' : 'tarefas pendentes'}`,
  properties: (summary) => `${summary.imoveis} ${summary.imoveis === 1 ? 'imóvel' : 'imóveis'}`,
}

const KIND_COUNT: Record<TransferKind, (summary: PortfolioSummary) => number> = {
  leads: (summary) => summary.leadsAtivos,
  tasks: (summary) => summary.tarefasPendentes,
  properties: (summary) => summary.imoveis,
}

const KINDS: TransferKind[] = ['leads', 'tasks', 'properties']

/** O que a pessoa tem e pode ser transferido (só o que tem pelo menos 1) */
export function transferableKinds(summary: PortfolioSummary): TransferKind[] {
  return KINDS.filter((kind) => KIND_COUNT[kind](summary) > 0)
}

/** "12 leads ativos, 5 tarefas pendentes, 3 imóveis" ou "nada na carteira" */
export function portfolioText(summary: PortfolioSummary): string {
  const kinds = transferableKinds(summary)
  return kinds.length > 0 ? kinds.map((kind) => KIND_LABEL[kind](summary)).join(', ') : 'nenhum lead, tarefa ou imóvel'
}

/** Seletor de quem recebe e caixas do que transferir (marcadas por padrão: `skipped` guarda o que foi desmarcado) */
export function TransferFields({
  idPrefix,
  summary,
  candidates,
  toUserId,
  onToUserId,
  skipped,
  onSkippedChange,
  placeholder,
}: {
  idPrefix: string
  summary: PortfolioSummary
  candidates: Member[]
  toUserId: string
  onToUserId: (id: string) => void
  skipped: TransferKind[]
  onSkippedChange: (skipped: TransferKind[]) => void
  placeholder: string
}) {
  const kinds = transferableKinds(summary)

  function toggle(kind: TransferKind) {
    onSkippedChange(skipped.includes(kind) ? skipped.filter((item) => item !== kind) : [...skipped, kind])
  }

  return (
    <div className="space-y-3">
      <div>
        <label htmlFor={`${idPrefix}-to`} className={labelClassName}>
          Transferir para
        </label>
        <select
          id={`${idPrefix}-to`}
          value={toUserId}
          onChange={(event) => onToUserId(event.target.value)}
          className={inputClassName}
        >
          <option value="">{placeholder}</option>
          {candidates.map((candidate) => (
            <option key={candidate.id} value={candidate.id}>
              {candidate.name} ({ROLE_META[candidate.role].label})
            </option>
          ))}
        </select>
        {candidates.length === 0 && (
          <p className="mt-1 text-xs text-muted-foreground">Não há outra pessoa ativa que você possa escolher.</p>
        )}
      </div>

      {toUserId && (
        <fieldset className="space-y-2">
          <legend className={labelClassName}>O que transferir</legend>
          {kinds.map((kind) => (
            <label key={kind} className="flex min-h-11 items-center gap-3 text-sm text-brand">
              <input
                type="checkbox"
                checked={!skipped.includes(kind)}
                onChange={() => toggle(kind)}
                className="size-5 accent-[#FF385C]"
              />
              {KIND_LABEL[kind](summary)}
            </label>
          ))}
        </fieldset>
      )}
    </div>
  )
}

/** Tipos marcados para transferir, na ordem fixa */
export function selectedKinds(summary: PortfolioSummary, skipped: TransferKind[]): TransferKind[] {
  return transferableKinds(summary).filter((kind) => !skipped.includes(kind))
}
