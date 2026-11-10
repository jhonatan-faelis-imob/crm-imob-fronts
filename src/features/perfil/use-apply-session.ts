import { useQueryClient } from '@tanstack/react-query'
import type { SessionTokens } from '@/services/auth.service'
import { useAuthStore } from '@/store/auth.store'

/**
 * Depois de editar o perfil ou trocar a senha o backend encerra as outras sessões e devolve tokens novos.
 * Troca os tokens (sem limpar o cache), atualiza o nome no menu e recarrega quem mostra o usuário
 */
export function useApplySession() {
  const queryClient = useQueryClient()
  return (tokens: SessionTokens, user?: { name: string }) => {
    const store = useAuthStore.getState()
    store.setTokens(tokens.accessToken, tokens.refreshToken)
    if (user) store.patchUser({ name: user.name })
    queryClient.invalidateQueries({ queryKey: ['me'] })
    queryClient.invalidateQueries({ queryKey: ['users'] })
    queryClient.invalidateQueries({ queryKey: ['profile'] })
  }
}
