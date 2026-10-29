import { Injectable } from '@nestjs/common'

import { PayloadError } from '@/core/domain/errors/payload-error'
import { Either, left, right } from '@/core/utils/Either'

import type { UpdateVehiclePayload } from '../../domain/dto/vehicle.payload'
import { VehicleRepository } from '../../domain/vehicle.repository'
import { VehicleNotFoundError } from '../errors/vehicle-not-found.error'

type Response = Either<VehicleNotFoundError | PayloadError, void>

@Injectable()
export class UpdateVehicleUseCase {
  constructor(private vehicleRepository: VehicleRepository) {}

  async execute(
    userId: string,
    id: string,
    data: UpdateVehiclePayload
  ): Promise<Response> {
    const vehicle = await this.vehicleRepository.findById(id, userId)

    if (!vehicle) {
      return left(new VehicleNotFoundError())
    }

    try {
      vehicle.update(data)
    } catch (error) {
      if (error instanceof PayloadError) {
        return left(error)
      }

      throw error
    }

    await this.vehicleRepository.save(vehicle)

    return right(void 0)
  }
}
