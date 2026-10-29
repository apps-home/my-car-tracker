import {
  CircleDollarSign,
  FileText,
  type LucideIcon,
  ParkingSquare,
  ShieldCheck,
  Siren,
  Sparkles,
  Ticket,
  Wrench
} from 'lucide-react'

import type { ExpenseCategory } from '../api/types'

export const EXPENSE_CATEGORY_LABELS: Record<ExpenseCategory, string> = {
  TOLL: 'Pedágio',
  PARKING: 'Estacionamento',
  IPVA: 'IPVA',
  LICENSING: 'Licenciamento',
  INSURANCE: 'Seguro',
  CAR_WASH: 'Lavagem / Estética',
  FINE: 'Multa',
  ACCESSORY: 'Acessório',
  OTHER: 'Outra'
}

export const EXPENSE_CATEGORY_ICONS: Record<ExpenseCategory, LucideIcon> = {
  TOLL: Ticket,
  PARKING: ParkingSquare,
  IPVA: FileText,
  LICENSING: FileText,
  INSURANCE: ShieldCheck,
  CAR_WASH: Sparkles,
  FINE: Siren,
  ACCESSORY: Wrench,
  OTHER: CircleDollarSign
}
