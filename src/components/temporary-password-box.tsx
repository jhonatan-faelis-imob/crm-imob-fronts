'use client'

import { Check, Copy, KeyRound } from 'lucide-react'
import { useState } from 'react'
import { toast } from '@/components/ui/toast'

/** Senha temporária devolvida uma única vez pela API, com Copiar e o aviso de que não aparece de novo */
export function TemporaryPasswordBox({ password }: { password: string }) {
  const [copied, setCopied] = useState(false)

  async function copy() {
    try {
      await navigator.clipboard.writeText(password)
      setCopied(true)
    } catch {
      toast.add({ title: 'Não consegui copiar. Selecione a senha e copie à mão', type: 'error' })
    }
  }

  return (
    <div className="rounded-[16px] border-[1.5px] border-[#F5C46B] bg-[#FFF7E0] p-4">
      <p className="flex items-center gap-1.5 text-xs font-medium text-[#B45309]">
        <KeyRound className="h-3.5 w-3.5" />
        Senha temporária
      </p>
      <div className="mt-2 flex items-center gap-2">
        <code className="min-w-0 flex-1 select-all break-all rounded-[8px] bg-white px-3 py-2 font-mono text-[15px] text-neutral-900">
          {password}
        </code>
        <button
          type="button"
          onClick={copy}
          className="flex min-h-11 shrink-0 items-center gap-1.5 rounded-[8px] border-[1.5px] border-neutral-200 bg-white px-3 py-2 text-sm font-medium text-neutral-900 transition-colors hover:border-brand hover:text-brand"
        >
          {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
          {copied ? 'Copiada' : 'Copiar'}
        </button>
      </div>
      <p className="mt-2 text-xs font-medium text-[#B45309]">Anote agora: esta senha não será exibida de novo.</p>
    </div>
  )
}
