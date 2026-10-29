import { Injectable } from '@nestjs/common'

import { Either, left, right } from '@/core/utils/Either'

import { FuelLogHTTP, FuelLogMapper } from '../../domain/fuel-log.mapper'
import { FuelLogRepository } from '../../domain/fuel-log.repository'
import { FuelLogNotFoundError } from '../errors/fuel-log-not-found.error'

type Response = Either<FuelLogNotFoundError, FuelLogHTTP>

@Injectable()
export class FindFuelLogByIdUseCase {
  constructor(private fuelLogRepository: FuelLogRepository) {}

  async execute(userId: string, id: string): Promise<Response> {
    const fuelLog = await this.fuelLogRepository.findById(id, userId)

    if (!fuelLog) {
      return left(new FuelLogNotFoundError())
    }

    return right(FuelLogMapper.toHTTP(fuelLog))
  }
}
