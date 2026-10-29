import { Injectable, Logger } from '@nestjs/common'
import { OnEvent } from '@nestjs/event-emitter'

import {
  DOMAIN_EVENTS,
  type VehicleOdometerUpdatedEvent
} from '@/core/domain/events/event.constants'
import { todayInTimeZone } from '@/core/utils/utc-date'
import { VehicleRepository } from '@/modules/vehicles/domain/vehicle.repository'

import { ScheduleAlertService } from '../application/services/schedule-alert.service'
import { ScheduleRepository } from '../domain/schedule.repository'

/** O km subiu: reavalia na hora os planos por quilometragem do veículo */
@Injectable()
export class VehicleOdometerUpdatedListener {
  private readonly logger = new Logger(VehicleOdometerUpdatedListener.name)

  constructor(
    private scheduleRepository: ScheduleRepository,
    private vehicleRepository: VehicleRepository,
    private scheduleAlertService: ScheduleAlertService
  ) {}

  @OnEvent(DOMAIN_EVENTS.VEHICLE_ODOMETER_UPDATED)
  async handle({ vehicleId }: VehicleOdometerUpdatedEvent): Promise<void> {
    try {
      const schedules =
        await this.scheduleRepository.findActiveByVehicleForSystem(vehicleId)

      if (!schedules.length) return

      const vehicles = await this.vehicleRepository.findManyByIdsForSystem([
        vehicleId
      ])

      await this.scheduleAlertService.evaluate(
        schedules,
        vehicles,
        todayInTimeZone()
      )
    } catch (error) {
      // O evento roda fora da requisição: um erro aqui não pode derrubar o processo
      this.logger.error(
        `Failed to evaluate schedules of vehicle ${vehicleId}`,
        error instanceof Error ? error.stack : error
      )
    }
  }
}
