import { Injectable } from '@nestjs/common'

import { Either, left, right } from '@/core/utils/Either'

import {
  MaintenanceHTTP,
  MaintenanceMapper
} from '../../domain/maintenance.mapper'
import { MaintenanceRepository } from '../../domain/maintenance.repository'
import { MaintenanceNotFoundError } from '../errors/maintenance-not-found.error'

type Response = Either<MaintenanceNotFoundError, MaintenanceHTTP>

@Injectable()
export class FindMaintenanceByIdUseCase {
  constructor(private maintenanceRepository: MaintenanceRepository) {}

  async execute(userId: string, id: string): Promise<Response> {
    const maintenance = await this.maintenanceRepository.findById(id, userId)

    if (!maintenance) {
      return left(new MaintenanceNotFoundError())
    }

    return right(MaintenanceMapper.toHTTP(maintenance))
  }
}
