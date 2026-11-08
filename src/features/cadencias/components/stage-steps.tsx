'use client'

import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Copy, GripVertical, MoreHorizontal, Pencil, Plus, Trash2, UsersRound } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Switch } from '@/components/ui/switch'
import { TASK_TYPE_META } from '@/features/tarefas/constants'
import { cn } from '@/lib/utils'
import type { CadenceStage, CadenceStep } from '@/types'
import { MAX_STEPS_PER_STAGE, formatOffset } from '../constants'

const iconButtonClassName =
  'flex h-11 w-11 shrink-0 items-center justify-center rounded-[8px] text-neutral-400 transition-colors disabled:cursor-not-allowed disabled:opacity-50 sm:h-9 sm:w-9'
const secondaryButtonClassName =
  'inline-flex h-11 w-full items-center justify-center gap-2 rounded-[8px] border-[0.5px] border-neutral-200 px-4 text-sm font-medium text-neutral-600 transition-colors hover:bg-neutral-100 disabled:cursor-not-allowed disabled:opacity-60 sm:h-10 sm:w-auto'

interface StepActions {
  onToggle: (step: CadenceStep, active: boolean) => void
  onEdit: (step: CadenceStep) => void
  onDuplicate: (step: CadenceStep) => void
  onDelete: (step: CadenceStep) => void
}

function StepRow({
  step,
  actions,
  isToggling,
  canDuplicate,
}: {
  step: CadenceStep
  actions: StepActions
  isToggling: boolean
  canDuplicate: boolean
}) {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } = useSortable({
    id: step.id,
  })
  const type = TASK_TYPE_META[step.type]
  const Icon = type.icon

  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn(
        'flex items-center gap-2 bg-white py-2.5 sm:gap-3',
        !step.active && 'opacity-60',
        isDragging && 'relative z-10 rounded-[12px] shadow-md',
      )}
    >
      <button
        type="button"
        ref={setActivatorNodeRef}
        {...attributes}
        {...listeners}
        aria-label="Arrastar para reordenar"
        className={`${iconButtonClassName} -ml-2 cursor-grab touch-none hover:bg-neutral-100 hover:text-neutral-900 active:cursor-grabbing`}
      >
        <GripVertical className="h-4 w-4" />
      </button>
      <span
        className="hidden h-9 w-9 shrink-0 items-center justify-center rounded-full sm:flex"
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
        onCheckedChange={(active) => actions.onToggle(step, active)}
        aria-label={step.active ? 'Desativar passo' : 'Ativar passo'}
      />
      {/* Celular: um menu só, para caber em 375px */}
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <button
              type="button"
              aria-label="Ações do passo"
              className={`${iconButtonClassName} hover:bg-neutral-100 hover:text-neutral-900 sm:hidden`}
            />
          }
        >
          <MoreHorizontal className="h-4 w-4" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-44 bg-white">
          <DropdownMenuItem className="min-h-11" onClick={() => actions.onEdit(step)}>
            <Pencil className="h-4 w-4" />
            Editar
          </DropdownMenuItem>
          <DropdownMenuItem className="min-h-11" disabled={!canDuplicate} onClick={() => actions.onDuplicate(step)}>
            <Copy className="h-4 w-4" />
            Duplicar
          </DropdownMenuItem>
          <DropdownMenuItem className="min-h-11 text-danger" onClick={() => actions.onDelete(step)}>
            <Trash2 className="h-4 w-4" />
            Excluir
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <div className="hidden shrink-0 items-center sm:flex">
        <button
          type="button"
          onClick={() => actions.onEdit(step)}
          aria-label="Editar passo"
          className={`${iconButtonClassName} hover:bg-neutral-100 hover:text-neutral-900`}
        >
          <Pencil className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => actions.onDuplicate(step)}
          disabled={!canDuplicate}
          aria-label="Duplicar passo"
          title={canDuplicate ? 'Duplicar passo' : `Máximo de ${MAX_STEPS_PER_STAGE} passos`}
          className={`${iconButtonClassName} hover:bg-neutral-100 hover:text-neutral-900`}
        >
          <Copy className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => actions.onDelete(step)}
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
  actions,
  togglingId,
  onAdd,
  onReorder,
  onApplyExisting,
  isApplying,
}: {
  stage: CadenceStage
  actions: StepActions
  togglingId: string | null
  onAdd: () => void
  onReorder: (orderedIds: string[]) => void
  onApplyExisting: () => void
  isApplying: boolean
}) {
  const steps = stage.cadenceSteps
  const isFull = steps.length >= MAX_STEPS_PER_STAGE
  const hasActiveSteps = steps.some((step) => step.active)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  function handleDragEnd({ active, over }: DragEndEvent) {
    if (!over || active.id === over.id) return
    const from = steps.findIndex((step) => step.id === active.id)
    const to = steps.findIndex((step) => step.id === over.id)
    if (from < 0 || to < 0) return
    onReorder(arrayMove(steps, from, to).map((step) => step.id))
  }

  return (
    <div>
      {steps.length === 0 ? (
        <p className="rounded-[12px] bg-neutral-100 p-3 text-sm text-neutral-400">
          Nenhuma tarefa automática nesta etapa.
        </p>
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={steps.map((step) => step.id)} strategy={verticalListSortingStrategy}>
            <ul className="divide-y-[0.5px] divide-neutral-200">
              {steps.map((step) => (
                <StepRow
                  key={step.id}
                  step={step}
                  actions={actions}
                  canDuplicate={!isFull}
                  isToggling={togglingId === step.id}
                />
              ))}
            </ul>
          </SortableContext>
        </DndContext>
      )}

      <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
        <button type="button" onClick={onAdd} disabled={isFull} className={secondaryButtonClassName}>
          <Plus className="h-4 w-4" />
          {isFull ? `Máximo de ${MAX_STEPS_PER_STAGE} passos` : 'Adicionar passo'}
        </button>
        {hasActiveSteps && (
          <button type="button" onClick={onApplyExisting} disabled={isApplying} className={secondaryButtonClassName}>
            <UsersRound className="h-4 w-4" />
            Aplicar aos leads desta etapa
          </button>
        )}
      </div>
    </div>
  )
}
