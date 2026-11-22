import { Pencil, Trash2 } from 'lucide-react'
import type { MessageTemplate } from '@/types'
import { templateTypeMeta } from '../constants'

const iconButtonClassName = 'flex h-11 w-11 items-center justify-center rounded-[8px] transition-colors'

export function TemplateCard({
  template,
  canManage,
  onEdit,
  onDelete,
}: {
  template: MessageTemplate
  canManage: boolean
  onEdit: () => void
  onDelete: () => void
}) {
  const type = templateTypeMeta(template.type)

  return (
    <div className="flex flex-col rounded-[16px] border-[0.5px] border-line bg-paper p-5">
      <div className="flex items-start justify-between gap-2">
        <p className="min-w-0 break-words text-base font-medium text-brand">{template.name}</p>
        {canManage && (
          <div className="-mr-3 -mt-3 flex shrink-0">
            <button
              type="button"
              onClick={onEdit}
              aria-label="Editar modelo"
              className={`${iconButtonClassName} text-muted-foreground hover:bg-canvas hover:text-brand`}
            >
              <Pencil className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={onDelete}
              aria-label="Excluir modelo"
              className={`${iconButtonClassName} text-danger hover:bg-[#FFEBEE]`}
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>

      <div className="mt-1.5 flex flex-wrap gap-1.5">
        <span
          className="rounded-full px-2 py-0.5 text-[11px] font-medium"
          style={{ backgroundColor: type.bg, color: type.text }}
        >
          {type.label}
        </span>
        <span className="rounded-full bg-canvas px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
          {template.isPublic ? 'Compartilhado' : 'Meu'}
        </span>
      </div>

      <p className="mt-3 line-clamp-3 flex-1 break-words text-sm text-muted-foreground">{template.content}</p>
      <p className="mt-3 text-xs text-muted-foreground">
        Usado {template.usageCount} {template.usageCount === 1 ? 'vez' : 'vezes'}
      </p>
    </div>
  )
}
