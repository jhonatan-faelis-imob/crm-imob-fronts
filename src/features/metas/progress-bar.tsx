export function ProgressBar({ value, className }: { value: number; className?: string }) {
  const width = Math.min(100, Math.max(0, value))

  return (
    <div className={`h-2 w-full rounded-full bg-neutral-200 ${className ?? ''}`}>
      <div className="h-2 rounded-full bg-brand transition-all" style={{ width: `${width}%` }} />
    </div>
  )
}
