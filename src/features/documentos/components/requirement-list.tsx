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
import { Ban, GripVertical, Pencil } from 'lucide-react'
import { Switch } from '@/components/ui/switch'
import { cn } from '@/lib/utils'
import type { DocumentRequirement } from '@/types'
import { categoryLabel } from '../constants'

const iconButtonClassName =
  'flex h-11 w-11 shrink-0 items-center justify-center rounded-[8px] text-neutral-400 transition-colors disabled:opacity-40 sm:h-9 sm:w-9'

export interface RequirementActions {
  onToggle: (requirement: DocumentRequirement, active: boolean) => void
  onEdit: (requirement: DocumentRequirement) => void
  onDeactivate: (requirement: DocumentRequirement) => void
}

function RequirementRow({
  requirement,
  actions,
  isToggling,
}: {
  requirement: DocumentRequirement
  actions: RequirementActions
  isToggling: boolean
}) {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } = useSortable({
    id: requirement.id,
  })

  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn(
        'flex items-center gap-2 bg-white py-2.5 sm:gap-3',
        !requirement.active && 'opacity-60',
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
      <div className="min-w-0 flex-1">
        <p className="break-words text-sm font-medium text-neutral-900">{requirement.name}</p>
        <p className="text-xs text-neutral-400">
          {categoryLabel(requirement.category)}
          {!requirement.required && ' · Opcional'}
          {requirement.appliesWhen === 'has_fgts' && ' · Só com FGTS'}
        </p>
      </div>
      <Switch
        checked={requirement.active}
        disabled={isToggling}
        onCheckedChange={(active) => actions.onToggle(requirement, active)}
        aria-label={requirement.active ? 'Desativar documento' : 'Ativar documento'}
      />
      <button
        type="button"
        onClick={() => actions.onEdit(requirement)}
        aria-label="Editar documento"
        className={`${iconButtonClassName} hover:bg-neutral-100 hover:text-neutral-900`}
      >
        <Pencil className="h-4 w-4" />
      </button>
      <button
        type="button"
        onClick={() => actions.onDeactivate(requirement)}
        disabled={!requirement.active}
        aria-label="Desativar documento"
        className={`${iconButtonClassName} hidden hover:bg-[#FFEBEE] hover:text-danger sm:flex`}
      >
        <Ban className="h-4 w-4" />
      </button>
    </li>
  )
}

export function RequirementList({
  requirements,
  actions,
  togglingId,
  onReorder,
}: {
  requirements: DocumentRequirement[]
  actions: RequirementActions
  togglingId: string | null
  onReorder: (orderedIds: string[]) => void
}) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  function handleDragEnd({ active, over }: DragEndEvent) {
    if (!over || active.id === over.id) return
    const from = requirements.findIndex((item) => item.id === active.id)
    const to = requirements.findIndex((item) => item.id === over.id)
    if (from < 0 || to < 0) return
    onReorder(arrayMove(requirements, from, to).map((item) => item.id))
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={requirements.map((item) => item.id)} strategy={verticalListSortingStrategy}>
        <ul className="divide-y-[0.5px] divide-neutral-200">
          {requirements.map((requirement) => (
            <RequirementRow
              key={requirement.id}
              requirement={requirement}
              actions={actions}
              isToggling={togglingId === requirement.id}
            />
          ))}
        </ul>
      </SortableContext>
    </DndContext>
  )
}
