export function startOfDay(date: Date) {
  const result = new Date(date)
  result.setHours(0, 0, 0, 0)
  return result
}

export function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
}

export function isOverdue(dueDate: string) {
  return new Date(dueDate).getTime() < startOfDay(new Date()).getTime()
}

export function isToday(dueDate: string) {
  return isSameDay(new Date(dueDate), new Date())
}

export function isTomorrow(dueDate: string) {
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  return isSameDay(new Date(dueDate), tomorrow)
}

export function isWithinNextDays(dueDate: string, days: number) {
  const due = startOfDay(new Date(dueDate)).getTime()
  const today = startOfDay(new Date()).getTime()
  const diffDays = Math.round((due - today) / 86400000)
  return diffDays >= 0 && diffDays <= days
}

export function isThisWeek(dueDate: string) {
  const due = new Date(dueDate)
  const today = new Date()
  const startOfWeek = startOfDay(today)
  startOfWeek.setDate(today.getDate() - today.getDay())
  const endOfWeek = new Date(startOfWeek)
  endOfWeek.setDate(startOfWeek.getDate() + 7)
  return due >= startOfWeek && due < endOfWeek
}

export function isThisMonth(dueDate: string) {
  const due = new Date(dueDate)
  const today = new Date()
  return due.getFullYear() === today.getFullYear() && due.getMonth() === today.getMonth()
}

export function isWithinRange(dueDate: string, startDate: string, endDate: string) {
  const due = startOfDay(new Date(dueDate)).getTime()
  if (startDate && due < startOfDay(new Date(startDate)).getTime()) return false
  if (endDate && due > startOfDay(new Date(endDate)).getTime()) return false
  return true
}

export function formatTime(dueDate: string) {
  return new Date(dueDate).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
}

export function formatDateBR(dueDate: string) {
  return new Date(dueDate).toLocaleDateString('pt-BR')
}

export function formatGroupDate(date: Date) {
  const formatted = new Intl.DateTimeFormat('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(date)
  return formatted.charAt(0).toUpperCase() + formatted.slice(1)
}
