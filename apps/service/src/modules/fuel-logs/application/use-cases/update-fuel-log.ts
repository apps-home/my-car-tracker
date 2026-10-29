import { Injectable } from '@nestjs/common'

import { PayloadError } from '@/core/domain/errors/payload-error'
import { Either, left, right } from '@/core/utils/Either'
import { SyncVehicleOdometerService } from '@/modules/vehicles/application/services/sync-vehicle-odometer'
import { VehicleRepository } from '@/modules/vehicles/domain/vehicle.repository'

import type { UpdateFuelLogPayload } from '../../domain/dto/fuel-log.payload'
import { FuelLogRepository } from '../../domain/fuel-log.repository'
import { FuelLogNotFoundError } from '../errors/fuel-log-not-found.error'
import { recalculateChain, validateOdometer } from '../fuel-log-chain'

type Response = Either<FuelLogNotFoundError | PayloadError, void>

@Injectable()
export class UpdateFuelLogUseCase {
  constructor(
    private fuelLogRepository: FuelLogRepository,
    private vehicleRepository: VehicleRepository,
    private syncVehicleOdometer: SyncVehicleOdometerService
  ) {}

  async execute(
    userId: string,
    id: string,
    data: UpdateFuelLogPayload
  ): Promise<Response> {
    const fuelLog = await this.fuelLogRepository.findById(id, userId)

    if (!fuelLog) {
      return left(new FuelLogNotFoundError())
    }

    const vehicle = await this.vehicleRepository.findById(
      fuelLog.vehicleId,
      userId
    )

    if (!vehicle) {
      return left(new FuelLogNotFoundError())
    }

    try {
      fuelLog.update(data)
    } catch (error) {
      if (error instanceof PayloadError) {
        return left(error)
      }

      throw error
    }

    const others = (
      await this.fuelLogRepository.findAllByVehicle(vehicle.id, userId)
    ).filter((item) => item.id !== fuelLog.id)

    const odometerError = validateOdometer(vehicle, others, fuelLog)

    if (odometerError) {
      return left(odometerError)
    }

    const changed = recalculateChain([...others, fuelLog])

    await this.fuelLogRepository.save(fuelLog)
    await this.fuelLogRepository.saveConsumption(
      changed.filter((item) => item !== fuelLog)
    )
    await this.syncVehicleOdometer.execute(vehicle, fuelLog.odometerKm)

    return right(void 0)
  }
}
