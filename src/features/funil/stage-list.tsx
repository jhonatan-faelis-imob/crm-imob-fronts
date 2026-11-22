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
import { ArrowRightLeft, GripVertical, MoreHorizontal, Pencil, Trash2 } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'
import { leadsText, type ApiStage } from './constants'

export interface StageRowActions {
  onEdit: (stage: ApiStage) => void
  onMove: (stage: ApiStage) => void
  onDelete: (stage: ApiStage) => void
}

function StageRow({ stage, actions }: { stage: ApiStage; actions: StageRowActions }) {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } = useSortable({
    id: stage.id,
  })

  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn(
        'flex items-center gap-2 rounded-[16px] border-[0.5px] border-line bg-paper p-2 pr-3 sm:gap-3',
        isDragging && 'relative z-10 shadow-md',
      )}
    >
      <button
        type="button"
        ref={setActivatorNodeRef}
        {...attributes}
        {...listeners}
        aria-label={`Arrastar a etapa ${stage.name} para reordenar`}
        className="flex size-11 shrink-0 cursor-grab touch-none items-center justify-center rounded-[8px] text-muted-foreground hover:bg-canvas hover:text-brand active:cursor-grabbing"
      >
        <GripVertical className="h-4 w-4" />
      </button>

      <span className="size-5 shrink-0 rounded-full" style={{ backgroundColor: stage.color }} aria-hidden="true" />

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
          <p className="truncate text-[15px] font-semibold text-brand">{stage.name}</p>
          {stage.isDefault && (
            <span className="rounded-full bg-canvas px-2 py-0.5 text-[11px] font-medium text-muted-foreground">Padrão</span>
          )}
        </div>
        <p className="text-xs text-muted-foreground">{leadsText(stage.leadsCount)}</p>
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <button
              type="button"
              aria-label={`Ações da etapa ${stage.name}`}
              className="flex size-11 shrink-0 items-center justify-center rounded-[8px] text-muted-foreground hover:bg-canvas hover:text-brand sm:size-9"
            />
          }
        >
          <MoreHorizontal className="h-4 w-4" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48 bg-paper">
          <DropdownMenuItem className="min-h-11" onClick={() => actions.onEdit(stage)}>
            <Pencil className="h-4 w-4" />
            Editar
          </DropdownMenuItem>
          <DropdownMenuItem className="min-h-11" disabled={stage.leadsCount === 0} onClick={() => actions.onMove(stage)}>
            <ArrowRightLeft className="h-4 w-4" />
            Mover leads
          </DropdownMenuItem>
          {!stage.isDefault && (
            <DropdownMenuItem className="min-h-11 text-danger" onClick={() => actions.onDelete(stage)}>
              <Trash2 className="h-4 w-4" />
              Excluir
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </li>
  )
}

/** Etapas na ordem do Kanban, reordenáveis arrastando (dnd-kit, com a alça visível) */
export function StageList({
  stages,
  actions,
  onReorder,
}: {
  stages: ApiStage[]
  actions: StageRowActions
  onReorder: (ordered: ApiStage[]) => void
}) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  function handleDragEnd({ active, over }: DragEndEvent) {
    if (!over || active.id === over.id) return
    const from = stages.findIndex((stage) => stage.id === active.id)
    const to = stages.findIndex((stage) => stage.id === over.id)
    if (from < 0 || to < 0) return
    onReorder(arrayMove(stages, from, to))
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={stages.map((stage) => stage.id)} strategy={verticalListSortingStrategy}>
        <ul className="space-y-2">
          {stages.map((stage) => (
            <StageRow key={stage.id} stage={stage} actions={actions} />
          ))}
        </ul>
      </SortableContext>
    </DndContext>
  )
}
