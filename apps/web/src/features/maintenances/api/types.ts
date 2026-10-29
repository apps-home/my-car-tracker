import type { PeriodParams } from '@/features/fuel-logs/api/types'
import type {
  CreateResponse,
  MutationResponse
} from '@/features/vehicles/api/types'

export type { CreateResponse, MutationResponse }

export const MAINTENANCE_TYPES = [
  'PREVENTIVE',
  'CORRECTIVE',
  'INSPECTION'
] as const

export type MaintenanceType = (typeof MAINTENANCE_TYPES)[number]

export interface MaintenanceItem {
  id: string
  scheduleId: string | null
  name: string
  brand: string | null
  partNumber: string | null
  quantity: number
  unitPrice: number
  totalPrice: number
  warrantyMonths: number | null
  warrantyUntil: string | null
}

export interface Maintenance {
  id: string
  vehicleId: string
  type: MaintenanceType
  title: string
  /** Dia do serviço (00:00 UTC) */
  date: string
  odometerKm: number
  workshopName: string | null
  laborCost: number
  partsCost: number
  totalAmount: number
  hasInvoice: boolean
  notes: string | null
  items: MaintenanceItem[]
  createdAt: string
  updatedAt: string
}

export interface MaintenanceItemDTO {
  scheduleId?: string | null
  name: string
  brand?: string | null
  partNumber?: string | null
  quantity?: number
  unitPrice: number
  totalPrice?: number
  warrantyMonths?: number | null
}

export interface CreateMaintenanceDTO {
  vehicleId: string
  type?: MaintenanceType
  title: string
  /** YYYY-MM-DD */
  date: string
  odometerKm: number
  workshopName?: string | null
  laborCost?: number
  partsCost?: number
  totalAmount?: number
  notes?: string | null
  items?: MaintenanceItemDTO[]
}

export type UpdateMaintenanceDTO = Partial<
  Omit<CreateMaintenanceDTO, 'vehicleId'>
>

export interface ListMaintenancesParams extends PeriodParams {
  vehicleId?: string
  type?: MaintenanceType
  search?: string
}

export interface ActiveWarranty {
  itemId: string
  maintenanceId: string
  maintenanceTitle: string
  maintenanceType: MaintenanceType
  vehicleId: string
  date: string
  workshopName: string | null
  name: string
  brand: string | null
  partNumber: string | null
  totalPrice: number
  warrantyMonths: number
  warrantyUntil: string
}

export interface InvoiceUrl {
  url: string
  expiresIn: number
}

export const MAINTENANCE_TASK_PRIORITIES = ['NEXT_VISIT', 'FUTURE'] as const

export type MaintenanceTaskPriority =
  (typeof MAINTENANCE_TASK_PRIORITIES)[number]

export interface MaintenanceTask {
  id: string
  vehicleId: string
  title: string
  priority: MaintenanceTaskPriority
  targetYear: number | null
  notes: string | null
  isCompleted: boolean
  completedAt: string | null
  createdAt: string
  updatedAt: string
}

export interface CreateMaintenanceTaskDTO {
  vehicleId: string
  title: string
  priority?: MaintenanceTaskPriority
  targetYear?: number | null
  notes?: string | null
}

export type UpdateMaintenanceTaskDTO = Partial<
  Omit<CreateMaintenanceTaskDTO, 'vehicleId'>
> & {
  isCompleted?: boolean
}
