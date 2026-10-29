import type { PeriodFilter } from '@/core/utils/date-range'

import type { MaintenanceType } from '../maintenance-type'

export interface MaintenanceItemPayload {
  /** Plano preventivo que esta peça/serviço cumpriu */
  scheduleId?: string | null
  name: string
  brand?: string | null
  partNumber?: string | null
  quantity?: number
  unitPrice: number
  /** Sem valor, é `quantity * unitPrice` */
  totalPrice?: number
  warrantyMonths?: number | null
}

export interface CreateMaintenancePayload {
  vehicleId: string
  type?: MaintenanceType
  title: string
  date: Date
  odometerKm: number
  workshopName?: string | null
  laborCost?: number
  /** Ignorado quando há itens (vira a soma deles) */
  partsCost?: number
  /** Valor fechado; sem valor, é mão de obra + peças */
  totalAmount?: number
  notes?: string | null
  items?: MaintenanceItemPayload[]
}

/** `items`, quando enviado, substitui a lista inteira */
export type UpdateMaintenancePayload = Partial<
  Omit<CreateMaintenancePayload, 'vehicleId'>
>

export interface ListMaintenancesParams extends PeriodFilter {
  userId: string
  vehicleId?: string
  type?: MaintenanceType
  /** Título, oficina, peça, marca ou código ("quando troquei a bateria?") */
  search?: string
}

export interface ListWarrantiesParams {
  userId: string
  vehicleId?: string
  /** Garantias com `warrantyUntil` a partir deste dia */
  activeOn: Date
}
