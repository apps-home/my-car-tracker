import { Injectable } from '@nestjs/common'

import { Either, right } from '@/core/utils/Either'

import type { ListVehiclesParams } from '../../domain/dto/vehicle.payload'
import { VehicleHTTP, VehicleMapper } from '../../domain/vehicle.mapper'
import { VehicleRepository } from '../../domain/vehicle.repository'

type Response = Either<never, VehicleHTTP[]>

@Injectable()
export class ListVehiclesUseCase {
  constructor(private vehicleRepository: VehicleRepository) {}

  async execute(params: ListVehiclesParams): Promise<Response> {
    const vehicles = await this.vehicleRepository.list(params)

    return right(vehicles.map(VehicleMapper.toHTTP))
  }
}
