import type { ReactNode } from 'react'

export const inputClassName =
  'w-full rounded-[12px] border-[1.5px] border-line bg-paper px-3 py-2.5 text-[15px] text-brand outline-none transition-colors placeholder:text-muted-foreground focus:border-brand'
export const inputWithIconClassName = `${inputClassName} pl-9`
export const labelClassName = 'mb-1.5 block text-[13px] font-medium text-brand'
export const errorClassName = 'mt-1 text-[12px] text-danger'

export function FormField({
  label,
  htmlFor,
  required,
  error,
  fullWidth,
  children,
}: {
  label: string
  htmlFor: string
  required?: boolean
  error?: string
  fullWidth?: boolean
  children: ReactNode
}) {
  return (
    <div className={fullWidth ? 'sm:col-span-2' : undefined}>
      <label htmlFor={htmlFor} className={labelClassName}>
        {label}
        {required && <span className="text-brand"> *</span>}
      </label>
      {children}
      {error && <p className={errorClassName}>{error}</p>}
    </div>
  )
}

export function IconInputWrapper({ icon, children }: { icon: ReactNode; children: ReactNode }) {
  return (
    <div className="relative">
      <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
        {icon}
      </span>
      {children}
    </div>
  )
}

export function FieldGrid({ children }: { children: ReactNode }) {
  return <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">{children}</div>
}
