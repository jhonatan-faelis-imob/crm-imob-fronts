import type { ReactNode } from 'react'
import { StageMoveProvider } from '@/features/leads/stage-move-provider'

export default function LeadsLayout({ children }: { children: ReactNode }) {
  return <StageMoveProvider>{children}</StageMoveProvider>
}
