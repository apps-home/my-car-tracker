import type {
  ScheduleAlertStatus,
  ScheduleTriggerRule
} from '../schedule-types'

export interface CreateSchedulePayload {
  vehicleId: string
  title: string
  description?: string | null
  triggerRule?: ScheduleTriggerRule
  intervalMonths?: number | null
  intervalKm?: number | null
  /** Sem valor, o ciclo começa hoje */
  lastExecutedAt?: Date | null
  /** Sem valor, o ciclo começa no km atual do veículo */
  lastExecutedOdometerKm?: number | null
  alertDaysBefore?: number
  alertKmBefore?: number
}

export type UpdateSchedulePayload = Partial<
  Omit<CreateSchedulePayload, 'vehicleId'> & { isActive: boolean }
>

export interface ListSchedulesParams {
  userId: string
  vehicleId?: string
  alertStatus?: ScheduleAlertStatus
  /** Por padrão só os ativos */
  includeInactive?: boolean
}

export interface SeedDefaultSchedulesPayload {
  vehicleId: string
  /** Chaves de DEFAULT_SCHEDULE_TEMPLATES; sem valor, todos */
  templates?: string[]
}
