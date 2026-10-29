import { Injectable } from '@nestjs/common'

import { Either, right } from '@/core/utils/Either'

import type { ListFuelLogsParams } from '../../domain/dto/fuel-log.payload'
import { FuelLogHTTP, FuelLogMapper } from '../../domain/fuel-log.mapper'
import { FuelLogRepository } from '../../domain/fuel-log.repository'

type Response = Either<never, FuelLogHTTP[]>

@Injectable()
export class ListFuelLogsUseCase {
  constructor(private fuelLogRepository: FuelLogRepository) {}

  async execute(params: ListFuelLogsParams): Promise<Response> {
    const fuelLogs = await this.fuelLogRepository.list(params)

    return right(fuelLogs.map(FuelLogMapper.toHTTP))
  }
}
