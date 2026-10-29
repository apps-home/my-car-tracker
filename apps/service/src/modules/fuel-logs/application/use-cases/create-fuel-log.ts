import { Injectable } from '@nestjs/common'

import { PayloadError } from '@/core/domain/errors/payload-error'
import { Either, left, right } from '@/core/utils/Either'
import { VehicleNotFoundError } from '@/modules/vehicles/application/errors/vehicle-not-found.error'
import { SyncVehicleOdometerService } from '@/modules/vehicles/application/services/sync-vehicle-odometer'
import { VehicleRepository } from '@/modules/vehicles/domain/vehicle.repository'

import type { CreateFuelLogPayload } from '../../domain/dto/fuel-log.payload'
import { FuelLog } from '../../domain/fuel-log.entity'
import { FuelLogHTTP, FuelLogMapper } from '../../domain/fuel-log.mapper'
import { FuelLogRepository } from '../../domain/fuel-log.repository'
import { recalculateChain, validateOdometer } from '../fuel-log-chain'

type Response = Either<VehicleNotFoundError | PayloadError, FuelLogHTTP>

@Injectable()
export class CreateFuelLogUseCase {
  constructor(
    private fuelLogRepository: FuelLogRepository,
    private vehicleRepository: VehicleRepository,
    private syncVehicleOdometer: SyncVehicleOdometerService
  ) {}

  async execute(userId: string, data: CreateFuelLogPayload): Promise<Response> {
    const vehicle = await this.vehicleRepository.findById(
      data.vehicleId,
      userId
    )

    if (!vehicle) {
      return left(new VehicleNotFoundError())
    }

    let fuelLog: FuelLog

    try {
      fuelLog = FuelLog.create(userId, data)
    } catch (error) {
      if (error instanceof PayloadError) {
        return left(error)
      }

      throw error
    }

    const existing = await this.fuelLogRepository.findAllByVehicle(
      vehicle.id,
      userId
    )

    const odometerError = validateOdometer(vehicle, existing, fuelLog)

    if (odometerError) {
      return left(odometerError)
    }

    const changed = recalculateChain([...existing, fuelLog])

    await this.fuelLogRepository.create(fuelLog)
    await this.fuelLogRepository.saveConsumption(
      changed.filter((item) => item !== fuelLog)
    )
    await this.syncVehicleOdometer.execute(vehicle, fuelLog.odometerKm)

    return right(FuelLogMapper.toHTTP(fuelLog))
  }
}
