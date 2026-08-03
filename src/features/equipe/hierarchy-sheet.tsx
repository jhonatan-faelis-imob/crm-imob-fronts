'use client'

import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { buildHierarchy, HierarchyTree } from './hierarchy-tree'
import type { Member } from './types'

export function HierarchySheet({
  open,
  onOpenChange,
  members,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  members: Member[]
}) {
  const nodes = buildHierarchy(members)

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full gap-0 p-0 sm:max-w-md">
        <SheetHeader className="border-b-[0.5px] border-neutral-200 p-4 pr-12 sm:p-6 sm:pr-14">
          <SheetTitle>Hierarquia da equipe</SheetTitle>
          <SheetDescription>Estrutura organizacional completa.</SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          <HierarchyTree nodes={nodes} />
        </div>
      </SheetContent>
    </Sheet>
  )
}
