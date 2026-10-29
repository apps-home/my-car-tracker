import { Injectable } from '@nestjs/common'

import { PayloadError } from '@/core/domain/errors/payload-error'
import { Either, left, right } from '@/core/utils/Either'
import { VehicleNotFoundError } from '@/modules/vehicles/application/errors/vehicle-not-found.error'
import { SyncVehicleOdometerService } from '@/modules/vehicles/application/services/sync-vehicle-odometer'
import { VehicleRepository } from '@/modules/vehicles/domain/vehicle.repository'

import type { CreateMaintenancePayload } from '../../domain/dto/maintenance.payload'
import { Maintenance } from '../../domain/maintenance.entity'
import {
  MaintenanceHTTP,
  MaintenanceMapper
} from '../../domain/maintenance.mapper'
import { MaintenanceRepository } from '../../domain/maintenance.repository'
import { ScheduleExecutionService } from '../services/schedule-execution.service'
import { validateMaintenanceOdometer } from '../validate-maintenance-odometer'

type Response = Either<VehicleNotFoundError | PayloadError, MaintenanceHTTP>

@Injectable()
export class CreateMaintenanceUseCase {
  constructor(
    private maintenanceRepository: MaintenanceRepository,
    private vehicleRepository: VehicleRepository,
    private syncVehicleOdometer: SyncVehicleOdometerService,
    private scheduleExecution: ScheduleExecutionService
  ) {}

  async execute(
    userId: string,
    data: CreateMaintenancePayload
  ): Promise<Response> {
    const vehicle = await this.vehicleRepository.findById(
      data.vehicleId,
      userId
    )

    if (!vehicle) {
      return left(new VehicleNotFoundError())
    }

    let maintenance: Maintenance

    try {
      maintenance = Maintenance.create(userId, data)
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

    await this.maintenanceRepository.create(maintenance)
    await this.syncVehicleOdometer.execute(vehicle, maintenance.odometerKm)
    await this.scheduleExecution.sync({
      userId,
      vehicle,
      current: maintenance
    })

    return right(MaintenanceMapper.toHTTP(maintenance))
  }
}
