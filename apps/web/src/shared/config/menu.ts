import { Home, type LucideIcon } from 'lucide-react'
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

// Veículos, abastecimentos, despesas, manutenções e planos entram aqui conforme as features forem criadas
export const headerMenu: MenuEntry[] = [
  { title: 'Painel', path: '/', icon: Home }
]

/** Rota ativa: "/" só casa exato; as demais casam também sub-rotas */
export function isPathActive(pathname: string, path: string): boolean {
  return path === '/' ? pathname === '/' : pathname.startsWith(path)
}
