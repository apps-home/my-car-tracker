import { Car, Fuel, Home, type LucideIcon, Receipt } from 'lucide-react'
import type { Route } from 'next'

export interface MenuLink {
  title: string
  path: Route
  icon: LucideIcon
}

export interface MenuGroup {
  title: string
  icon: LucideIcon
  items: MenuLink[]
}

export type MenuEntry = MenuLink | MenuGroup

export function isMenuGroup(entry: MenuEntry): entry is MenuGroup {
  return 'items' in entry
}

// Manutenções e planos preventivos entram aqui quando as features forem criadas
export const headerMenu: MenuEntry[] = [
  { title: 'Painel', path: '/', icon: Home },
  { title: 'Abastecimentos', path: '/fuel-logs', icon: Fuel },
  { title: 'Despesas', path: '/expenses', icon: Receipt },
  { title: 'Veículos', path: '/vehicles', icon: Car }
]

/** Rota ativa: "/" só casa exato; as demais casam também sub-rotas */
export function isPathActive(pathname: string, path: string): boolean {
  return path === '/' ? pathname === '/' : pathname.startsWith(path)
}
