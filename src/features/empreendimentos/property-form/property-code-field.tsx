'use client'

import { useQuery } from '@tanstack/react-query'
import { AlertTriangle } from 'lucide-react'
import { propertiesService } from '@/services/properties.service'
import {
  CODE_CHANGED_WARNING,
  PROPERTY_CODE_HELP,
  PROPERTY_CODE_MAX,
  sanitizePropertyCodeInput,
} from '../property-code'
import { FormField, inputClassName } from './field'

// "Código do imóvel" nos cadastros de revenda e de empreendimento
export function PropertyCodeField({
  id,
  value,
  onChange,
  onBlur,
  error,
  isEditing,
  originalCode,
  publishedToPortals = false,
}: {
  id: string
  value: string
  onChange: (value: string) => void
  onBlur?: () => void
  error?: string
  isEditing: boolean
  /** Código salvo (edição); null = imóvel antigo, ainda sem código */
  originalCode?: string | null
  publishedToPortals?: boolean
}) {
  // Só uma dica: o número de verdade é dado pela API ao salvar
  const { data } = useQuery({
    queryKey: ['properties', 'next-code'],
    queryFn: propertiesService.getNextCode,
    enabled: !isEditing,
    staleTime: 0,
    meta: { silent: true },
  })

  const placeholder = isEditing
    ? originalCode
      ? originalCode
      : 'Sem código'
    : data
      ? `Automático (próximo: ${data.hint})`
      : 'Automático'

  const trimmed = value.trim()
  const changedPublished = publishedToPortals && !!originalCode && trimmed !== '' && trimmed !== originalCode

  return (
    <FormField label="Código do imóvel" htmlFor={id} error={error}>
      <input
        id={id}
        value={value}
        onChange={(event) => onChange(sanitizePropertyCodeInput(event.target.value))}
        onBlur={onBlur}
        placeholder={placeholder}
        maxLength={PROPERTY_CODE_MAX}
        autoCapitalize="characters"
        autoComplete="off"
        spellCheck={false}
        className={`${inputClassName} font-mono uppercase placeholder:font-sans placeholder:normal-case`}
      />
      <p className="mt-1 text-xs text-neutral-400">
        {isEditing && originalCode && trimmed === ''
          ? 'Em branco, o código atual é mantido.'
          : PROPERTY_CODE_HELP}
      </p>
      {changedPublished && (
        <p className="mt-1.5 flex gap-1.5 rounded-[8px] bg-[#FFF7E0] p-2 text-xs text-[#B45309]">
          <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          {CODE_CHANGED_WARNING}
        </p>
      )}
    </FormField>
  )
}

/** Chip "Cód. 00012" em fonte monoespaçada */
export function CodeChip({ code, className = '' }: { code: string | null | undefined; className?: string }) {
  if (!code) return null
  return (
    <span className={`inline-flex items-center rounded-full bg-neutral-100 px-2 py-0.5 font-mono text-[11px] font-medium text-neutral-600 ${className}`}>
      Cód. {code}
    </span>
  )
}
