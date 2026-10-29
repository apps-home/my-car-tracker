import { Injectable } from '@nestjs/common'

import { PayloadError } from '@/core/domain/errors/payload-error'
import { Either, left, right } from '@/core/utils/Either'
import { todayInTimeZone } from '@/core/utils/utc-date'
import { VehicleNotFoundError } from '@/modules/vehicles/application/errors/vehicle-not-found.error'
import { VehicleRepository } from '@/modules/vehicles/domain/vehicle.repository'

import type { CreateSchedulePayload } from '../../domain/dto/schedule.payload'
import { MaintenanceSchedule } from '../../domain/schedule.entity'
import { ScheduleHTTP, ScheduleMapper } from '../../domain/schedule.mapper'
import { ScheduleRepository } from '../../domain/schedule.repository'
import { validateScheduleOdometer } from '../validate-schedule-odometer'

type Response = Either<VehicleNotFoundError | PayloadError, ScheduleHTTP>

@Injectable()
export class CreateScheduleUseCase {
  constructor(
    private scheduleRepository: ScheduleRepository,
    private vehicleRepository: VehicleRepository
  ) {}

  async execute(
    userId: string,
    data: CreateSchedulePayload
  ): Promise<Response> {
    const vehicle = await this.vehicleRepository.findById(
      data.vehicleId,
      userId
    )

    if (!vehicle) {
      return left(new VehicleNotFoundError())
    }

    const today = todayInTimeZone()
    let schedule: MaintenanceSchedule

    try {
      schedule = MaintenanceSchedule.create(userId, data, {
        today,
        currentOdometerKm: vehicle.currentOdometerKm
      })
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

    // Quem cria o plano já vê o status na tela: grava sem notificar
    const evaluation = schedule.evaluate(vehicle.currentOdometerKm, today)

    await this.scheduleRepository.create(schedule)

    return right(ScheduleMapper.toHTTP(schedule, evaluation))
  }
}
