'use client'

import { useState, type FormEvent } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { inputClassName, labelClassName } from '@/features/equipe/field'
import { stageError } from './api'
import { ColorPicker } from './color-picker'
import {
  DEFAULT_STAGE_COLOR,
  MAX_STAGE_NAME,
  defaultPlacement,
  isHexColor,
  orderIndexFor,
  type ApiStage,
  type Placement,
} from './constants'
import { useFunnelMutations } from './use-funnel-actions'

/** Criar (stage nulo) ou editar nome e cor. Montado com key a cada abertura: o estado nasce limpo */
function StageForm({
  stage,
  stages,
  onClose,
  onTerminal,
}: {
  stage: ApiStage | null
  stages: ApiStage[]
  onClose: () => void
  /** 409 STAGE_IS_TERMINAL ao renomear Ganho ou Perdido */
  onTerminal: () => void
}) {
  const { create, update } = useFunnelMutations()
  const suggestion = defaultPlacement(stages)
  const [name, setName] = useState(stage?.name ?? '')
  const [color, setColor] = useState(stage?.color ?? DEFAULT_STAGE_COLOR)
  const [placement, setPlacement] = useState<Placement>(suggestion?.placement ?? 'depois')
  const [anchorId, setAnchorId] = useState(suggestion?.stageId ?? '')
  const [error, setError] = useState<string | null>(null)

  const trimmed = name.trim()
  const valid = trimmed.length > 0 && isHexColor(color)
  const pending = create.isPending || update.isPending

  function onFailure(caught: unknown) {
    const info = stageError(caught, 'Não foi possível salvar a etapa.')
    if (info.code === 'STAGE_IS_TERMINAL') {
      onClose()
      onTerminal()
      return
    }
    setError(info.message)
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!valid) return
    setError(null)
    if (stage) {
      const dto: { name?: string; color?: string } = {}
      if (trimmed !== stage.name) dto.name = trimmed
      if (color.toLowerCase() !== stage.color.toLowerCase()) dto.color = color
      if (Object.keys(dto).length === 0) {
        onClose()
        return
      }
      update.mutate({ id: stage.id, dto }, { onSuccess: onClose, onError: onFailure })
      return
    }
    const anchor = stages.find((item) => item.id === anchorId)
    const orderIndex = anchor ? orderIndexFor(anchor, placement) : stages.length + 1
    create.mutate({ name: trimmed, color, orderIndex }, { onSuccess: onClose, onError: onFailure })
  }

  return (
    <form onSubmit={submit} className="flex min-h-0 flex-1 flex-col">
      <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-4 sm:p-6">
        <div>
          <label htmlFor="stage-name" className={labelClassName}>
            Nome da etapa
          </label>
          <input
            id="stage-name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            maxLength={MAX_STAGE_NAME}
            autoComplete="off"
            autoFocus
            className={`${inputClassName} text-base`}
          />
        </div>

        <div>
          <p className={labelClassName}>Cor</p>
          <ColorPicker value={color} onChange={setColor} idPrefix="stage" />
        </div>

        {!stage && (
          <fieldset>
            <legend className={labelClassName}>Posição no Kanban</legend>
            <div className="flex flex-col gap-2 sm:flex-row">
              <select
                aria-label="Antes ou depois"
                value={placement}
                onChange={(event) => setPlacement(event.target.value as Placement)}
                className={`${inputClassName} text-base sm:w-32`}
              >
                <option value="antes">Antes de</option>
                <option value="depois">Depois de</option>
              </select>
              <select
                aria-label="Etapa de referência"
                value={anchorId}
                onChange={(event) => setAnchorId(event.target.value)}
                className={`${inputClassName} min-w-0 flex-1 text-base`}
              >
                {stages.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </select>
            </div>
          </fieldset>
        )}

        {error && (
          <p role="alert" className="rounded-[12px] bg-danger/10 px-3 py-2 text-sm text-danger">
            {error}
          </p>
        )}
      </div>

      <DialogFooter className="mx-0 mb-0 shrink-0 flex-row justify-end gap-2 rounded-b-2xl border-t-[0.5px] border-neutral-200 bg-white p-4 sm:p-6">
        <button
          type="button"
          onClick={onClose}
          className="min-h-11 rounded-[8px] border-[1.5px] border-neutral-200 px-4 text-sm font-medium text-neutral-600 hover:bg-neutral-100"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={!valid || pending}
          className="min-h-11 rounded-[8px] bg-brand px-4 text-sm font-medium text-white hover:bg-brand-dark disabled:opacity-60"
        >
          {pending ? 'Salvando...' : stage ? 'Salvar' : 'Criar etapa'}
        </button>
      </DialogFooter>
    </form>
  )
}

export function StageDialog({
  open,
  stage,
  stages,
  session,
  onClose,
  onTerminal,
}: {
  open: boolean
  /** Nulo = nova etapa */
  stage: ApiStage | null
  stages: ApiStage[]
  /** Muda a cada abertura para remontar o formulário */
  session: number
  onClose: () => void
  onTerminal: () => void
}) {
  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent className="flex max-h-[90vh] w-[calc(100%-2rem)] max-w-md flex-col gap-0 rounded-2xl border-[0.5px] border-neutral-200 bg-white p-0 ring-0">
        <DialogHeader className="shrink-0 gap-1 border-b-[0.5px] border-neutral-200 p-4 pr-12 sm:p-6 sm:pr-14">
          <DialogTitle>{stage ? 'Editar etapa' : 'Nova etapa'}</DialogTitle>
          <DialogDescription>
            {stage ? 'Nome e cor da coluna no Kanban.' : 'Ela aparece como uma nova coluna no Kanban.'}
          </DialogDescription>
        </DialogHeader>
        {open && <StageForm key={session} stage={stage} stages={stages} onClose={onClose} onTerminal={onTerminal} />}
      </DialogContent>
    </Dialog>
  )
}
