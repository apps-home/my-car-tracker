import { Injectable } from '@nestjs/common'

import { PayloadError } from '@/core/domain/errors/payload-error'
import { Either, left, right } from '@/core/utils/Either'
import { todayInTimeZone } from '@/core/utils/utc-date'
import { VehicleRepository } from '@/modules/vehicles/domain/vehicle.repository'

import type { UpdateSchedulePayload } from '../../domain/dto/schedule.payload'
import { ScheduleRepository } from '../../domain/schedule.repository'
import { ScheduleNotFoundError } from '../errors/schedule-not-found.error'
import { validateScheduleOdometer } from '../validate-schedule-odometer'

type Response = Either<ScheduleNotFoundError | PayloadError, void>

@Injectable()
export class UpdateScheduleUseCase {
  constructor(
    private scheduleRepository: ScheduleRepository,
    private vehicleRepository: VehicleRepository
  ) {}

  async execute(
    userId: string,
    id: string,
    data: UpdateSchedulePayload
  ): Promise<Response> {
    const schedule = await this.scheduleRepository.findById(id, userId)

    if (!schedule) {
      return left(new ScheduleNotFoundError())
    }

    const vehicle = await this.vehicleRepository.findById(
      schedule.vehicleId,
      userId
    )

    if (!vehicle) {
      return left(new ScheduleNotFoundError())
    }

    try {
      schedule.update(data)
    } catch (error) {
      if (error instanceof PayloadError) {
        return left(error)
      }

      throw error
    }

    const odometerError = validateScheduleOdometer(vehicle, schedule)

    if (odometerError) {
      return left(odometerError)
    }

    schedule.evaluate(vehicle.currentOdometerKm, todayInTimeZone())

    await this.scheduleRepository.save(schedule)

    return right(void 0)
  }
}
