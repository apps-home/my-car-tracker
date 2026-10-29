import { Injectable } from '@nestjs/common'

import { Either, right } from '@/core/utils/Either'
import { todayInTimeZone } from '@/core/utils/utc-date'
import { VehicleRepository } from '@/modules/vehicles/domain/vehicle.repository'

import type { ListSchedulesParams } from '../../domain/dto/schedule.payload'
import { ScheduleHTTP, ScheduleMapper } from '../../domain/schedule.mapper'
import { ScheduleRepository } from '../../domain/schedule.repository'
import { evaluateSchedule } from '../../domain/schedule-calculator'
import { ALERT_SEVERITY } from '../../domain/schedule-types'

type Response = Either<never, ScheduleHTTP[]>

/** Restante para ordenar: o que vence antes aparece primeiro */
function urgency(schedule: ScheduleHTTP) {
  return Math.min(
    schedule.daysRemaining ?? Number.POSITIVE_INFINITY,
    // ~40 km por dia aproxima km e dias na mesma escala
    schedule.kmRemaining !== null
      ? schedule.kmRemaining / 40
      : Number.POSITIVE_INFINITY
  )
}

@Injectable()
export class ListSchedulesUseCase {
  constructor(
    private scheduleRepository: ScheduleRepository,
    private vehicleRepository: VehicleRepository
  ) {}

  /**
   * O status sai do cálculo do momento (km atual e hoje), não do gravado,
   * que só muda no listener, no cron ou numa escrita.
   */
  async execute({
    alertStatus,
    ...params
  }: ListSchedulesParams): Promise<Response> {
    const [schedules, vehicles] = await Promise.all([
      this.scheduleRepository.list(params),
      this.vehicleRepository.list({ userId: params.userId })
    ])

    const kmByVehicle = new Map(
      vehicles.map((vehicle) => [vehicle.id, vehicle.currentOdometerKm])
    )
    const today = todayInTimeZone()

    const result = schedules
      .map((schedule) =>
        ScheduleMapper.toHTTP(
          schedule,
          evaluateSchedule(
            schedule,
            kmByVehicle.get(schedule.vehicleId) ?? 0,
            today
          )
        )
      )
      .filter(
        (schedule) => !alertStatus || schedule.alertStatus === alertStatus
      )
      .sort(
        (a, b) =>
          ALERT_SEVERITY[b.alertStatus] - ALERT_SEVERITY[a.alertStatus] ||
          urgency(a) - urgency(b)
      )

    return right(result)
  }
}
