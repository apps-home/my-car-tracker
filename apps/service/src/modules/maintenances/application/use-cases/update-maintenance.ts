import { Injectable } from '@nestjs/common'

import { PayloadError } from '@/core/domain/errors/payload-error'
import { Either, left, right } from '@/core/utils/Either'
import { SyncVehicleOdometerService } from '@/modules/vehicles/application/services/sync-vehicle-odometer'
import { VehicleRepository } from '@/modules/vehicles/domain/vehicle.repository'

import type { UpdateMaintenancePayload } from '../../domain/dto/maintenance.payload'
import { MaintenanceRepository } from '../../domain/maintenance.repository'
import { MaintenanceNotFoundError } from '../errors/maintenance-not-found.error'
import { ScheduleExecutionService } from '../services/schedule-execution.service'
import { validateMaintenanceOdometer } from '../validate-maintenance-odometer'

type Response = Either<MaintenanceNotFoundError | PayloadError, void>

@Injectable()
export class UpdateMaintenanceUseCase {
  constructor(
    private maintenanceRepository: MaintenanceRepository,
    private vehicleRepository: VehicleRepository,
    private syncVehicleOdometer: SyncVehicleOdometerService,
    private scheduleExecution: ScheduleExecutionService
  ) {}

  async execute(
    userId: string,
    id: string,
    data: UpdateMaintenancePayload
  ): Promise<Response> {
    const maintenance = await this.maintenanceRepository.findById(id, userId)

    if (!maintenance) {
      return left(new MaintenanceNotFoundError())
    }

    const vehicle = await this.vehicleRepository.findById(
      maintenance.vehicleId,
      userId
    )

    if (!vehicle) {
      return left(new MaintenanceNotFoundError())
    }

    const previous = {
      ...maintenance.execution,
      scheduleIds: maintenance.scheduleIds
    }

    try {
      maintenance.update(data)
    } catch (error) {
      if (error instanceof PayloadError) {
        return left(error)
      }

      throw error
    }

    const error =
      validateMaintenanceOdometer(vehicle, maintenance) ??
      (await this.scheduleExecution.validate(
        userId,
        vehicle.id,
        maintenance.scheduleIds
      ))

    if (error) {
      return left(error)
    }

    await this.maintenanceRepository.save(maintenance)
    await this.syncVehicleOdometer.execute(vehicle, maintenance.odometerKm)
    await this.scheduleExecution.sync({
      userId,
      vehicle,
      current: maintenance,
      previous
    })

    return right(void 0)
  }
}
