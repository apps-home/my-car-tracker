import { faker } from '@faker-js/faker'
import { makeVehicle } from '@test/factories/make-vehicle'
import { InMemoryVehicleRepository } from '@test/repositories/in-memory-vehicle.repository'
import { beforeEach, describe, expect, it } from 'vitest'

import { VehicleNotFoundError } from '../errors/vehicle-not-found.error'
import { FindVehicleByIdUseCase } from './find-vehicle'

describe('FindVehicleByIdUseCase', () => {
  let vehicleRepository: InMemoryVehicleRepository
  let sut: FindVehicleByIdUseCase

  beforeEach(() => {
    vehicleRepository = new InMemoryVehicleRepository()
    sut = new FindVehicleByIdUseCase(vehicleRepository)
  })

  it('should find a vehicle of the user', async () => {
    const vehicle = makeVehicle()
    vehicleRepository.items.push(vehicle)

    const result = await sut.execute(vehicle.userId, vehicle.id)

    expect(result.isRight()).toBe(true)
    if (result.isRight()) {
      expect(result.value.id).toBe(vehicle.id)
    }
  })

  it('should not find the vehicle of another user', async () => {
    const vehicle = makeVehicle()
    vehicleRepository.items.push(vehicle)

    const result = await sut.execute(faker.string.alphanumeric(32), vehicle.id)

    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(VehicleNotFoundError)
  })
})
