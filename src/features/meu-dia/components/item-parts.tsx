import type { MyDayReason } from '@/types'
import { SEVERITY_CLASS_NAME } from '../constants'

export function ItemRibbon() {
  return <p className="bg-brand px-4 py-1.5 text-xs font-medium text-white sm:px-5">Comece por aqui</p>
}

export function ReasonChips({ reasons }: { reasons: MyDayReason[] }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {reasons.map((reason) => (
        <span
          key={reason.code}
          className={`rounded-full px-2 py-0.5 text-xs font-medium ${SEVERITY_CLASS_NAME[reason.severity]}`}
        >
          {reason.label}
        </span>
      ))}
    </div>
  )
}
