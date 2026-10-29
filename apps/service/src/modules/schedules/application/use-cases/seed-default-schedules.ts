import { Injectable } from '@nestjs/common'

import { PayloadError } from '@/core/domain/errors/payload-error'
import { Either, left, right } from '@/core/utils/Either'
import { todayInTimeZone } from '@/core/utils/utc-date'
import { VehicleNotFoundError } from '@/modules/vehicles/application/errors/vehicle-not-found.error'
import { VehicleRepository } from '@/modules/vehicles/domain/vehicle.repository'

import { DEFAULT_SCHEDULE_TEMPLATES } from '../../domain/default-schedule-templates'
import type { SeedDefaultSchedulesPayload } from '../../domain/dto/schedule.payload'
import { MaintenanceSchedule } from '../../domain/schedule.entity'
import { ScheduleHTTP, ScheduleMapper } from '../../domain/schedule.mapper'
import { ScheduleRepository } from '../../domain/schedule.repository'

type Response = Either<VehicleNotFoundError | PayloadError, ScheduleHTTP[]>

/**
 * Ativa os planos padrão escolhidos. O ciclo começa hoje, no km atual;
 * planos com o mesmo título já existentes no veículo são ignorados.
 */
@Injectable()
export class SeedDefaultSchedulesUseCase {
  constructor(
    private scheduleRepository: ScheduleRepository,
    private vehicleRepository: VehicleRepository
  ) {}

  async execute(
    userId: string,
    { vehicleId, templates }: SeedDefaultSchedulesPayload
  ): Promise<Response> {
    const vehicle = await this.vehicleRepository.findById(vehicleId, userId)

    if (!vehicle) {
      return left(new VehicleNotFoundError())
    }

    const unknown = templates?.filter(
      (key) => !DEFAULT_SCHEDULE_TEMPLATES.some((item) => item.key === key)
    )

    if (unknown?.length) {
      return left(new PayloadError(`Unknown templates: ${unknown.join(', ')}`))
    }

    const existing = await this.scheduleRepository.list({
      userId,
      vehicleId,
      includeInactive: true
    })
    const existingTitles = new Set(
      existing.map((schedule) => schedule.title.toLowerCase())
    )
    const today = todayInTimeZone()

    const schedules = DEFAULT_SCHEDULE_TEMPLATES.filter(
      (template) =>
        (!templates || templates.includes(template.key)) &&
        !existingTitles.has(template.title.toLowerCase())
    ).map((template) => {
      const schedule = MaintenanceSchedule.create(
        userId,
        {
          vehicleId,
          title: template.title,
          description: template.description,
          triggerRule: template.triggerRule,
          intervalMonths: template.intervalMonths,
          intervalKm: template.intervalKm
        },
        { today, currentOdometerKm: vehicle.currentOdometerKm }
      )

      return {
        schedule,
        evaluation: schedule.evaluate(vehicle.currentOdometerKm, today)
      }
    })

    await this.scheduleRepository.createMany(
      schedules.map(({ schedule }) => schedule)
    )

    return right(
      schedules.map(({ schedule, evaluation }) =>
        ScheduleMapper.toHTTP(schedule, evaluation)
      )
    )
  }
}
