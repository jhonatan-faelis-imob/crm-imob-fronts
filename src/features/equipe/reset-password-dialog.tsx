'use client'

import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { TemporaryPasswordBox } from '@/components/temporary-password-box'
import { usersService } from '@/services/users.service'
import { apiErrorMessage } from './api'
import { errorClassName, inputClassName, labelClassName } from './field'
import type { Member } from './types'
import { invalidateMemberChanges } from './use-member-actions'

const ALPHABET = 'abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789'

function generatePassword(): string {
  const bytes = new Uint8Array(14)
  crypto.getRandomValues(bytes)
  return Array.from(bytes, (byte) => ALPHABET[byte % ALPHABET.length]).join('')
}

/** Gestor define a senha de outra pessoa; as sessões dela caem. A senha aparece para copiar depois de salvar */
export function ResetPasswordDialog({ member, onClose }: { member: Member | null; onClose: () => void }) {
  const queryClient = useQueryClient()
  const [password, setPassword] = useState('')
  const [saved, setSaved] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const reset = useMutation({
    mutationFn: ({ id, value }: { id: string; value: string }) => usersService.resetPassword(id, value),
    onSuccess: (_data, { value }) => {
      setSaved(value)
      invalidateMemberChanges(queryClient)
    },
    onError: (caught) => setError(apiErrorMessage(caught, 'Não foi possível redefinir a senha.')),
  })

  const tooShort = password.length > 0 && password.length < 8

  return (
    <Dialog open={member !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="flex w-[calc(100%-2rem)] max-w-md flex-col gap-0 rounded-2xl border-[0.5px] border-neutral-200 bg-white p-0 ring-0">
        <DialogHeader className="gap-1 border-b-[0.5px] border-neutral-200 p-4 pr-12 sm:p-6 sm:pr-14">
          <DialogTitle>{saved ? 'Senha redefinida' : 'Resetar senha'}</DialogTitle>
          <DialogDescription>
            {saved ? `Repasse a senha para ${member?.name}.` : `${member?.name} será desconectado de todos os aparelhos.`}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 p-4 sm:p-6">
          {saved ? (
            <TemporaryPasswordBox password={saved} />
          ) : (
            <>
              <label htmlFor="reset-password" className={labelClassName}>
                Nova senha
              </label>
              <div className="flex gap-2">
                <input
                  id="reset-password"
                  value={password}
                  onChange={(event) => {
                    setPassword(event.target.value)
                    setError(null)
                  }}
                  autoComplete="off"
                  className={`${inputClassName} text-base`}
                />
                <button
                  type="button"
                  onClick={() => setPassword(generatePassword())}
                  className="min-h-11 shrink-0 rounded-[8px] border-[1.5px] border-neutral-200 px-3 text-sm font-medium text-neutral-900 hover:border-brand hover:text-brand"
                >
                  Gerar
                </button>
              </div>
              {tooShort && <p className={errorClassName}>Mínimo de 8 caracteres</p>}
              {error && <p className={errorClassName}>{error}</p>}
            </>
          )}
        </div>

        <DialogFooter className="mx-0 mb-0 flex-row justify-end gap-2 rounded-b-2xl border-t-[0.5px] border-neutral-200 bg-white p-4 sm:p-6">
          {saved ? (
            <button
              type="button"
              onClick={onClose}
              className="min-h-11 rounded-[8px] bg-brand px-4 text-sm font-medium text-white hover:bg-brand-dark"
            >
              Concluir
            </button>
          ) : (
            <>
              <button
                type="button"
                onClick={onClose}
                className="min-h-11 rounded-[8px] border-[1.5px] border-neutral-200 px-4 text-sm font-medium text-neutral-600 hover:bg-neutral-100"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={password.length < 8 || reset.isPending}
                onClick={() => member && reset.mutate({ id: member.id, value: password })}
                className="min-h-11 rounded-[8px] bg-brand px-4 text-sm font-medium text-white hover:bg-brand-dark disabled:opacity-60"
              >
                {reset.isPending ? 'Salvando...' : 'Redefinir senha'}
              </button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
