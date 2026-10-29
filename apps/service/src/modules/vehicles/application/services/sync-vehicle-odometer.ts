import { Injectable } from '@nestjs/common'

import { DomainEventPublisher } from '@/core/domain/events/domain-event-publisher.interface'
import {
  DOMAIN_EVENTS,
  type VehicleOdometerUpdatedEvent
} from '@/core/domain/events/event.constants'

import type { Vehicle } from '../../domain/vehicle.entity'
import { VehicleRepository } from '../../domain/vehicle.repository'

/**
 * Usado pelos lançamentos com odômetro (abastecimento, despesa e manutenção):
 * avança o km atual do veículo e emite `vehicle.odometer-updated`.
 */
@Injectable()
export class SyncVehicleOdometerService {
  constructor(
    private vehicleRepository: VehicleRepository,
    private eventPublisher: DomainEventPublisher
  ) {}

  async execute(vehicle: Vehicle, odometerKm: number): Promise<boolean> {
    if (!vehicle.syncOdometer(odometerKm)) {
      return false
    }

    await this.vehicleRepository.save(vehicle)

    this.eventPublisher.publish<VehicleOdometerUpdatedEvent>(
      DOMAIN_EVENTS.VEHICLE_ODOMETER_UPDATED,
      {
        vehicleId: vehicle.id,
        userId: vehicle.userId,
        currentOdometerKm: vehicle.currentOdometerKm
      }
    )

    return true
  }
}
