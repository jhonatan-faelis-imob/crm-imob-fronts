'use client'

import { Pencil, Plus, Trash2 } from 'lucide-react'
import { Switch } from '@/components/ui/switch'
import { TASK_TYPE_META } from '@/features/tarefas/constants'
import type { CadenceStage, CadenceStep } from '@/types'
import { MAX_STEPS_PER_STAGE, formatOffset } from '../constants'

const iconButtonClassName =
  'flex h-11 w-11 items-center justify-center rounded-[8px] text-neutral-400 transition-colors sm:h-9 sm:w-9'

function StepRow({
  step,
  onToggle,
  onEdit,
  onDelete,
  isToggling,
}: {
  step: CadenceStep
  onToggle: (active: boolean) => void
  onEdit: () => void
  onDelete: () => void
  isToggling: boolean
}) {
  const type = TASK_TYPE_META[step.type]
  const Icon = type.icon

  return (
    <li className={`flex items-center gap-3 py-2.5 ${step.active ? '' : 'opacity-60'}`}>
      <span
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full"
        style={{ backgroundColor: type.bg, color: type.text }}
      >
        <Icon className="h-4 w-4" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-xs text-neutral-400">
          {formatOffset(step.offsetDays)} · {step.dueTime} · {type.label}
          {step.skipWeekends && ' · sem fim de semana'}
        </p>
        <p className="break-words text-sm font-medium text-neutral-900">{step.title}</p>
      </div>
      <Switch
        checked={step.active}
        disabled={isToggling}
        onCheckedChange={onToggle}
        aria-label={step.active ? 'Desativar passo' : 'Ativar passo'}
      />
      <div className="flex shrink-0 items-center">
        <button
          type="button"
          onClick={onEdit}
          aria-label="Editar passo"
          className={`${iconButtonClassName} hover:bg-neutral-100 hover:text-neutral-900`}
        >
          <Pencil className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={onDelete}
          aria-label="Excluir passo"
          className={`${iconButtonClassName} hover:bg-[#FFEBEE] hover:text-danger`}
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </li>
  )
}

export function StageSteps({
  stage,
  onAdd,
  onEdit,
  onDelete,
  onToggle,
  togglingId,
}: {
  stage: CadenceStage
  onAdd: () => void
  onEdit: (step: CadenceStep) => void
  onDelete: (step: CadenceStep) => void
  onToggle: (step: CadenceStep, active: boolean) => void
  togglingId: string | null
}) {
  const isFull = stage.cadenceSteps.length >= MAX_STEPS_PER_STAGE

  return (
    <div>
      {stage.cadenceSteps.length === 0 ? (
        <p className="rounded-[12px] bg-neutral-100 p-3 text-sm text-neutral-400">
          Nenhuma tarefa automática nesta etapa.
        </p>
      ) : (
        <ul className="divide-y-[0.5px] divide-neutral-200">
          {stage.cadenceSteps.map((step) => (
            <StepRow
              key={step.id}
              step={step}
              isToggling={togglingId === step.id}
              onToggle={(active) => onToggle(step, active)}
              onEdit={() => onEdit(step)}
              onDelete={() => onDelete(step)}
            />
          ))}
        </ul>
      )}
      <button
        type="button"
        onClick={onAdd}
        disabled={isFull}
        className="mt-3 inline-flex h-11 w-full items-center justify-center gap-2 rounded-[8px] border-[0.5px] border-neutral-200 px-4 text-sm font-medium text-neutral-600 transition-colors hover:bg-neutral-100 disabled:cursor-not-allowed disabled:opacity-60 sm:h-10 sm:w-auto"
      >
        <Plus className="h-4 w-4" />
        {isFull ? `Máximo de ${MAX_STEPS_PER_STAGE} passos` : 'Adicionar passo'}
      </button>
    </div>
  )
}
