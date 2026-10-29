import type { Prisma } from '@lib/my-car-tracker-db'

import { MaintenanceSchedule } from '../../domain/schedule.entity'
import { ScheduleMapper } from '../../domain/schedule.mapper'

export class PrismaScheduleMapper {
  static toDomain(
    raw: Prisma.MaintenanceScheduleGetPayload<{}>
  ): MaintenanceSchedule {
    return new MaintenanceSchedule({
      id: raw.id,
      vehicleId: raw.vehicleId,
      userId: raw.userId,
      title: raw.title,
      description: raw.description,
      triggerRule: raw.triggerRule,
      intervalMonths: raw.intervalMonths,
      intervalKm: raw.intervalKm,
      lastExecutedAt: raw.lastExecutedAt,
      lastExecutedOdometerKm: raw.lastExecutedOdometerKm,
      nextDueDate: raw.nextDueDate,
      nextDueOdometerKm: raw.nextDueOdometerKm,
      alertDaysBefore: raw.alertDaysBefore,
      alertKmBefore: raw.alertKmBefore,
      alertStatus: raw.alertStatus,
      lastNotifiedAt: raw.lastNotifiedAt,
      isActive: raw.isActive,
      createdAt: raw.createdAt,
      updatedAt: raw.updatedAt
    })
  }

  static toPrisma(
    schedule: MaintenanceSchedule
  ): Prisma.MaintenanceScheduleUncheckedCreateInput {
    return ScheduleMapper.toProps(schedule)
  }
}
