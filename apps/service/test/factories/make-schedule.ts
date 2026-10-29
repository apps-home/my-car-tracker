import { faker } from '@faker-js/faker'

import { addMonthsUtc, startOfDayUtc } from '@/core/utils/utc-date'
import type { CreateSchedulePayload } from '@/modules/schedules/domain/dto/schedule.payload'
import {
  MaintenanceSchedule,
  type ScheduleProps
} from '@/modules/schedules/domain/schedule.entity'

export function makeSchedulePayload(
  override: Partial<CreateSchedulePayload> = {}
): CreateSchedulePayload {
  return {
    vehicleId: faker.string.uuid(),
    title: faker.commerce.productName(),
    triggerRule: 'WHICHEVER_COMES_FIRST',
    intervalMonths: faker.helpers.arrayElement([6, 12, 24]),
    intervalKm: faker.helpers.arrayElement([5_000, 10_000, 20_000]),
    ...override
  }
}

/** Plano com última execução em `lastExecutedAt`/km; o próximo vencimento é calculado */
export function makeSchedule(
  override: Partial<ScheduleProps> = {}
): MaintenanceSchedule {
  const lastExecutedAt =
    override.lastExecutedAt ?? startOfDayUtc(faker.date.recent({ days: 60 }))
  const lastExecutedOdometerKm =
    override.lastExecutedOdometerKm ??
    faker.number.int({ min: 10_000, max: 50_000 })
  const intervalMonths =
    override.intervalMonths !== undefined ? override.intervalMonths : 6
  const intervalKm =
    override.intervalKm !== undefined ? override.intervalKm : 10_000

  return new MaintenanceSchedule({
    id: faker.string.uuid(),
    vehicleId: faker.string.uuid(),
    userId: faker.string.alphanumeric(32),
    title: faker.commerce.productName(),
    description: null,
    triggerRule: 'WHICHEVER_COMES_FIRST',
    intervalMonths,
    intervalKm,
    lastExecutedAt,
    lastExecutedOdometerKm,
    nextDueDate: intervalMonths
      ? addMonthsUtc(lastExecutedAt, intervalMonths)
      : null,
    nextDueOdometerKm: intervalKm ? lastExecutedOdometerKm + intervalKm : null,
    alertDaysBefore: 30,
    alertKmBefore: 500,
    alertStatus: 'ON_TRACK',
    lastNotifiedAt: null,
    isActive: true,
    createdAt: faker.date.past(),
    updatedAt: faker.date.recent(),
    ...override
  })
}
