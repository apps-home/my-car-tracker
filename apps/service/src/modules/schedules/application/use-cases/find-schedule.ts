import { Injectable } from '@nestjs/common'

import { Either, left, right } from '@/core/utils/Either'
import { todayInTimeZone } from '@/core/utils/utc-date'
import { VehicleRepository } from '@/modules/vehicles/domain/vehicle.repository'

import { ScheduleHTTP, ScheduleMapper } from '../../domain/schedule.mapper'
import { ScheduleRepository } from '../../domain/schedule.repository'
import { evaluateSchedule } from '../../domain/schedule-calculator'
import { ScheduleNotFoundError } from '../errors/schedule-not-found.error'

type Response = Either<ScheduleNotFoundError, ScheduleHTTP>

@Injectable()
export class FindScheduleByIdUseCase {
  constructor(
    private scheduleRepository: ScheduleRepository,
    private vehicleRepository: VehicleRepository
  ) {}

  async execute(userId: string, id: string): Promise<Response> {
    const schedule = await this.scheduleRepository.findById(id, userId)

    if (!schedule) {
      return left(new ScheduleNotFoundError())
    }

    const vehicle = await this.vehicleRepository.findById(
      schedule.vehicleId,
      userId
    )

    return right(
      ScheduleMapper.toHTTP(
        schedule,
        evaluateSchedule(
          schedule,
          vehicle?.currentOdometerKm ?? 0,
          todayInTimeZone()
        )
      )
    )
  }
}
