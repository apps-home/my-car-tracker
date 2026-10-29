import type {
  CreateResponse,
  MutationResponse
} from '@/features/vehicles/api/types'

export type { CreateResponse, MutationResponse }

export const SCHEDULE_TRIGGER_RULES = [
  'WHICHEVER_COMES_FIRST',
  'TIME_ONLY',
  'ODOMETER_ONLY'
] as const

export type ScheduleTriggerRule = (typeof SCHEDULE_TRIGGER_RULES)[number]

export type ScheduleAlertStatus = 'ON_TRACK' | 'DUE_SOON' | 'OVERDUE'

export interface Schedule {
  id: string
  vehicleId: string
  title: string
  description: string | null
  triggerRule: ScheduleTriggerRule
  intervalMonths: number | null
  intervalKm: number | null
  lastExecutedAt: string | null
  lastExecutedOdometerKm: number | null
  nextDueDate: string | null
  nextDueOdometerKm: number | null
  alertDaysBefore: number
  alertKmBefore: number
  /** Avaliado no momento da consulta (km atual e hoje) */
  alertStatus: ScheduleAlertStatus
  lastNotifiedAt: string | null
  isActive: boolean
  createdAt: string
  updatedAt: string
  daysRemaining: number | null
  kmRemaining: number | null
}

export interface ScheduleTemplate {
  key: string
  title: string
  description: string
  triggerRule: ScheduleTriggerRule
  intervalMonths: number | null
  intervalKm: number | null
}

export interface CreateScheduleDTO {
  vehicleId: string
  title: string
  description?: string | null
  triggerRule?: ScheduleTriggerRule
  intervalMonths?: number | null
  intervalKm?: number | null
  /** YYYY-MM-DD */
  lastExecutedAt?: string | null
  lastExecutedOdometerKm?: number | null
  alertDaysBefore?: number
  alertKmBefore?: number
}

export type UpdateScheduleDTO = Partial<
  Omit<CreateScheduleDTO, 'vehicleId'>
> & {
  isActive?: boolean
}

export interface ListSchedulesParams {
  vehicleId?: string
  alertStatus?: ScheduleAlertStatus
  includeInactive?: boolean
}

export interface SeedDefaultSchedulesDTO {
  vehicleId: string
  templates?: string[]
}

export interface SeedDefaultSchedulesResponse extends MutationResponse {
  created: number
}
