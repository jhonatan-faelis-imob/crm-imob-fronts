import type { Role } from '@/types'

export const ROLES: Role[] = ['diretor', 'gerente', 'coordenador', 'corretor', 'administrativo']

export const ROLE_META: Record<Role, { label: string; bg: string; text: string }> = {
  diretor: { label: 'Diretor', bg: '#F3E8FF', text: '#7C3AED' },
  gerente: { label: 'Gerente', bg: '#EBF5FF', text: '#0070F3' },
  coordenador: { label: 'Coordenador', bg: '#FFF3E0', text: '#C45800' },
  corretor: { label: 'Corretor', bg: '#E8F5E9', text: '#008A05' },
  administrativo: { label: 'Administrativo', bg: '#F7F7F7', text: '#767676' },
}

export const ROLES_WITH_TEAM: Role[] = ['coordenador', 'corretor']
