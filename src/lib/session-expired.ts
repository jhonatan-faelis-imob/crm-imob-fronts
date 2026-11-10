// Aviso de sessão expirada: o interceptor marca antes de mandar para /login (recarrega a página,
// então o toast não sobreviveria) e a tela de login mostra uma vez

const KEY = 'session-expired'

export const SESSION_EXPIRED_MESSAGE = 'Sua sessão expirou. Entre novamente'

export function markSessionExpired() {
  try {
    sessionStorage.setItem(KEY, '1')
  } catch {
    // Sem sessionStorage (modo privado restrito): só não aparece o aviso
  }
}

/** true uma vez só, depois de markSessionExpired */
export function consumeSessionExpired(): boolean {
  try {
    const marked = sessionStorage.getItem(KEY) === '1'
    sessionStorage.removeItem(KEY)
    return marked
  } catch {
    return false
  }
}

/** Rotas em que um 401 é resposta normal (credencial errada), não sessão vencida */
export function isAuthEndpoint(url: string | undefined): boolean {
  return !!url && /\/auth\/(login|refresh)\b/.test(url)
}
