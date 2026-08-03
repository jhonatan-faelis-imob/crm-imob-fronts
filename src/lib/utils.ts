import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getInitials(name: string) {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase()
}

export function formatCurrency(value: number) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    maximumFractionDigits: 0,
  }).format(value)
}

export function daysSince(dateIso: string) {
  const diffMs = Date.now() - new Date(dateIso).getTime()
  return Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)))
}

export const ROLE_LABELS: Record<string, string> = {
  diretor: 'Diretor',
  gerente: 'Gerente',
  coordenador: 'Coordenador',
  corretor: 'Corretor',
  administrativo: 'Administrativo',
}
