import { Injectable } from '@nestjs/common'

import { Either, left, right } from '@/core/utils/Either'

import { VehicleHTTP, VehicleMapper } from '../../domain/vehicle.mapper'
import { VehicleRepository } from '../../domain/vehicle.repository'
import { VehicleNotFoundError } from '../errors/vehicle-not-found.error'

type Response = Either<VehicleNotFoundError, VehicleHTTP>

@Injectable()
export class FindVehicleByIdUseCase {
  constructor(private vehicleRepository: VehicleRepository) {}

  async execute(userId: string, id: string): Promise<Response> {
    const vehicle = await this.vehicleRepository.findById(id, userId)

    if (!vehicle) {
      return left(new VehicleNotFoundError())
    }

    return right(VehicleMapper.toHTTP(vehicle))
  }
}
