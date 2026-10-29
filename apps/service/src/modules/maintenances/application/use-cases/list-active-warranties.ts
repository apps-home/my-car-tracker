import { Injectable } from '@nestjs/common'

import { Either, right } from '@/core/utils/Either'
import { todayInTimeZone } from '@/core/utils/utc-date'

import {
  type ActiveWarranty,
  MaintenanceRepository
} from '../../domain/maintenance.repository'

type Response = Either<never, ActiveWarranty[]>

@Injectable()
export class ListActiveWarrantiesUseCase {
  constructor(private maintenanceRepository: MaintenanceRepository) {}

  async execute(params: {
    userId: string
    vehicleId?: string
  }): Promise<Response> {
    const warranties = await this.maintenanceRepository.listActiveWarranties({
      ...params,
      activeOn: todayInTimeZone()
    })

    return right(warranties)
  }
}
