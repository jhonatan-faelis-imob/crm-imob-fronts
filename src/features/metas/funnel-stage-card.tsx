import { ProgressBar } from './progress-bar'

export function FunnelStageCard({
  label,
  meta,
  realizado,
}: {
  label: string
  meta: number
  realizado: number
}) {
  const pct = meta > 0 ? (realizado / meta) * 100 : 0

  return (
    <div className="w-[112px] shrink-0 rounded-[16px] border-[0.5px] border-neutral-200 bg-white p-3">
      <p className="text-xl font-semibold text-neutral-900">{realizado}</p>
      <p className="text-xs text-neutral-400">meta {meta}</p>
      <p className="mt-1 truncate text-[11px] font-medium text-neutral-600">{label}</p>
      <div className="mt-2">
        <ProgressBar value={pct} />
      </div>
    </div>
  )
}
