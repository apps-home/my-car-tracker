import { faker } from '@faker-js/faker'
import { makeVehicle } from '@test/factories/make-vehicle'
import { InMemoryVehicleRepository } from '@test/repositories/in-memory-vehicle.repository'
import { beforeEach, describe, expect, it } from 'vitest'

import { VehicleNotFoundError } from '../errors/vehicle-not-found.error'
import { DeleteVehicleUseCase } from './delete-vehicle'

describe('DeleteVehicleUseCase', () => {
  let vehicleRepository: InMemoryVehicleRepository
  let sut: DeleteVehicleUseCase

  beforeEach(() => {
    vehicleRepository = new InMemoryVehicleRepository()
    sut = new DeleteVehicleUseCase(vehicleRepository)
  })

  it('should delete a vehicle of the user', async () => {
    const vehicle = makeVehicle()
    vehicleRepository.items.push(vehicle)

    const result = await sut.execute(vehicle.userId, vehicle.id)

    expect(result.isRight()).toBe(true)
    expect(vehicleRepository.items).toHaveLength(0)
  })

  it('should not delete the vehicle of another user', async () => {
    const vehicle = makeVehicle()
    vehicleRepository.items.push(vehicle)

    const result = await sut.execute(faker.string.alphanumeric(32), vehicle.id)

    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(VehicleNotFoundError)
    expect(vehicleRepository.items).toHaveLength(1)
  })
})
