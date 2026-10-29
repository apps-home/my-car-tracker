import { Injectable, Logger } from '@nestjs/common'
import { Cron } from '@nestjs/schedule'

import { APP_TIME_ZONE, todayInTimeZone } from '@/core/utils/utc-date'
import { VehicleRepository } from '@/modules/vehicles/domain/vehicle.repository'

import { ScheduleAlertService } from '../application/services/schedule-alert.service'
import { ScheduleRepository } from '../domain/schedule.repository'

/** Todo dia às 08:00 (São Paulo): a passagem do tempo vence planos sem o km mudar */
@Injectable()
export class EvaluateMaintenanceSchedulesCron {
  private readonly logger = new Logger(EvaluateMaintenanceSchedulesCron.name)

  constructor(
    private scheduleRepository: ScheduleRepository,
    private vehicleRepository: VehicleRepository,
    private scheduleAlertService: ScheduleAlertService
  ) {}

  @Cron('0 8 * * *', {
    name: 'evaluate-maintenance-schedules',
    timeZone: APP_TIME_ZONE
  })
  async run(): Promise<void> {
    try {
      const schedules = await this.scheduleRepository.findAllActiveForSystem()
      const vehicleIds = [
        ...new Set(schedules.map(({ vehicleId }) => vehicleId))
      ]
      const vehicles =
        await this.vehicleRepository.findManyByIdsForSystem(vehicleIds)

      const summary = await this.scheduleAlertService.evaluate(
        schedules,
        vehicles,
        todayInTimeZone()
      )

      this.logger.log(
        `Schedules evaluated: ${summary.evaluated}, changed: ${summary.changed}, notified: ${summary.notified}`
      )
    } catch (error) {
      this.logger.error(
        'Failed to evaluate maintenance schedules',
        error instanceof Error ? error.stack : error
      )
    }
  }
}
