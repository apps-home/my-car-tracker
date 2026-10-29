import type { MaintenanceSchedule, ScheduleProps } from './schedule.entity'
import type { ScheduleEvaluation } from './schedule-calculator'

export type ScheduleHTTP = Omit<ScheduleProps, 'userId'> &
  Pick<ScheduleEvaluation, 'daysRemaining' | 'kmRemaining'>

export class ScheduleMapper {
  /** Com a avaliação do momento (status, dias e km restantes) */
  static toHTTP(
    schedule: MaintenanceSchedule,
    evaluation?: ScheduleEvaluation
  ): ScheduleHTTP {
    return {
      id: schedule.id,
      vehicleId: schedule.vehicleId,
      title: schedule.title,
      description: schedule.description,
      triggerRule: schedule.triggerRule,
      intervalMonths: schedule.intervalMonths,
      intervalKm: schedule.intervalKm,
      lastExecutedAt: schedule.lastExecutedAt,
      lastExecutedOdometerKm: schedule.lastExecutedOdometerKm,
      nextDueDate: schedule.nextDueDate,
      nextDueOdometerKm: schedule.nextDueOdometerKm,
      alertDaysBefore: schedule.alertDaysBefore,
      alertKmBefore: schedule.alertKmBefore,
      alertStatus: evaluation?.status ?? schedule.alertStatus,
      lastNotifiedAt: schedule.lastNotifiedAt,
      isActive: schedule.isActive,
      createdAt: schedule.createdAt,
      updatedAt: schedule.updatedAt,
      daysRemaining: evaluation?.daysRemaining ?? null,
      kmRemaining: evaluation?.kmRemaining ?? null
    }
  }

  static toProps(schedule: MaintenanceSchedule): ScheduleProps {
    return {
      id: schedule.id,
      vehicleId: schedule.vehicleId,
      userId: schedule.userId,
      title: schedule.title,
      description: schedule.description,
      triggerRule: schedule.triggerRule,
      intervalMonths: schedule.intervalMonths,
      intervalKm: schedule.intervalKm,
      lastExecutedAt: schedule.lastExecutedAt,
      lastExecutedOdometerKm: schedule.lastExecutedOdometerKm,
      nextDueDate: schedule.nextDueDate,
      nextDueOdometerKm: schedule.nextDueOdometerKm,
      alertDaysBefore: schedule.alertDaysBefore,
      alertKmBefore: schedule.alertKmBefore,
      alertStatus: schedule.alertStatus,
      lastNotifiedAt: schedule.lastNotifiedAt,
      isActive: schedule.isActive,
      createdAt: schedule.createdAt,
      updatedAt: schedule.updatedAt
    }
  }
}
