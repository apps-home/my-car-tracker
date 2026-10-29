import { Injectable } from '@nestjs/common'

import { Either, left, right } from '@/core/utils/Either'

import { FuelLogRepository } from '../../domain/fuel-log.repository'
import { FuelLogNotFoundError } from '../errors/fuel-log-not-found.error'
import { recalculateChain } from '../fuel-log-chain'

type Response = Either<FuelLogNotFoundError, void>

@Injectable()
export class DeleteFuelLogUseCase {
  constructor(private fuelLogRepository: FuelLogRepository) {}

  async execute(userId: string, id: string): Promise<Response> {
    const fuelLog = await this.fuelLogRepository.findById(id, userId)

    if (!fuelLog) {
      return left(new FuelLogNotFoundError())
    }

    await this.fuelLogRepository.delete(fuelLog)

    const remaining = await this.fuelLogRepository.findAllByVehicle(
      fuelLog.vehicleId,
      userId
    )

    await this.fuelLogRepository.saveConsumption(recalculateChain(remaining))

    return right(void 0)
  }
}
