import { Injectable } from '@nestjs/common'

import { Either, left, right } from '@/core/utils/Either'

import { VehicleRepository } from '../../domain/vehicle.repository'
import { VehicleNotFoundError } from '../errors/vehicle-not-found.error'

type Response = Either<VehicleNotFoundError, void>

@Injectable()
export class DeleteVehicleUseCase {
  constructor(private vehicleRepository: VehicleRepository) {}

  async execute(userId: string, id: string): Promise<Response> {
    const vehicle = await this.vehicleRepository.findById(id, userId)

    if (!vehicle) {
      return left(new VehicleNotFoundError())
    }

    await this.vehicleRepository.delete(vehicle)

    return right(void 0)
  }
}
