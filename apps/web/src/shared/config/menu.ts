import {
  CalendarCheck,
  Car,
  Fuel,
  Home,
  type LucideIcon,
  Receipt,
  Wrench
} from 'lucide-react'
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

export const headerMenu: MenuEntry[] = [
  { title: 'Painel', path: '/', icon: Home },
  { title: 'Abastecimentos', path: '/fuel-logs', icon: Fuel },
  { title: 'Despesas', path: '/expenses', icon: Receipt },
  {
    title: 'Oficina',
    icon: Wrench,
    items: [
      { title: 'Manutenções', path: '/maintenances', icon: Wrench },
      { title: 'Planos preventivos', path: '/schedules', icon: CalendarCheck }
    ]
  },
  { title: 'Veículos', path: '/vehicles', icon: Car }
]

/** Rota ativa: "/" só casa exato; as demais casam também sub-rotas */
export function isPathActive(pathname: string, path: string): boolean {
  return path === '/' ? pathname === '/' : pathname.startsWith(path)
}
