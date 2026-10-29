import { Injectable } from '@nestjs/common'

import { PayloadError } from '@/core/domain/errors/payload-error'
import { Either, left, right } from '@/core/utils/Either'

import type { CreateVehiclePayload } from '../../domain/dto/vehicle.payload'
import { Vehicle } from '../../domain/vehicle.entity'
import { VehicleHTTP, VehicleMapper } from '../../domain/vehicle.mapper'
import { VehicleRepository } from '../../domain/vehicle.repository'

type Response = Either<PayloadError, VehicleHTTP>

@Injectable()
export class CreateVehicleUseCase {
  constructor(private vehicleRepository: VehicleRepository) {}

  async execute(userId: string, data: CreateVehiclePayload): Promise<Response> {
    let vehicle: Vehicle

    try {
      vehicle = Vehicle.create(userId, data)
    } catch (error) {
      if (error instanceof PayloadError) {
        return left(error)
      }

      throw error
    }

    await this.vehicleRepository.create(vehicle)

    return right(VehicleMapper.toHTTP(vehicle))
  }
}
