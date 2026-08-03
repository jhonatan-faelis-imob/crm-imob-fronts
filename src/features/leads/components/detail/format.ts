export function formatDateBR(iso: string) {
  return new Date(iso).toLocaleDateString('pt-BR')
}

export function formatDateTimeBR(iso: string) {
  return new Date(iso).toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function formatRelativeTime(iso: string) {
  const diffMs = Date.now() - new Date(iso).getTime()
  const diffMinutes = Math.round(diffMs / 60000)
  const diffHours = Math.round(diffMs / 3600000)
  const diffDays = Math.round(diffMs / 86400000)

  if (Math.abs(diffMinutes) < 60) {
    return diffMinutes <= 1 ? 'agora' : `há ${diffMinutes} min`
  }
  if (Math.abs(diffHours) < 24) {
    return `há ${diffHours}h`
  }
  if (diffDays === 1) return 'há 1 dia'
  if (diffDays > 1) return `há ${diffDays} dias`
  if (diffDays === -1) return 'em 1 dia'
  if (diffDays < -1) return `em ${Math.abs(diffDays)} dias`
  return 'hoje'
}
