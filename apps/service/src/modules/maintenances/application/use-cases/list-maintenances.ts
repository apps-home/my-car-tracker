import { Injectable } from '@nestjs/common'

import { Either, right } from '@/core/utils/Either'

import type { ListMaintenancesParams } from '../../domain/dto/maintenance.payload'
import {
  MaintenanceHTTP,
  MaintenanceMapper
} from '../../domain/maintenance.mapper'
import { MaintenanceRepository } from '../../domain/maintenance.repository'

type Response = Either<never, MaintenanceHTTP[]>

@Injectable()
export class ListMaintenancesUseCase {
  constructor(private maintenanceRepository: MaintenanceRepository) {}

  async execute(params: ListMaintenancesParams): Promise<Response> {
    const maintenances = await this.maintenanceRepository.list(params)

    return right(maintenances.map(MaintenanceMapper.toHTTP))
  }
}
