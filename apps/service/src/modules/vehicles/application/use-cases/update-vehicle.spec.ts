import { faker } from '@faker-js/faker'
import { makeVehicle } from '@test/factories/make-vehicle'
import { InMemoryVehicleRepository } from '@test/repositories/in-memory-vehicle.repository'
import { beforeEach, describe, expect, it } from 'vitest'

import { PayloadError } from '@/core/domain/errors/payload-error'

import { VehicleNotFoundError } from '../errors/vehicle-not-found.error'
import { UpdateVehicleUseCase } from './update-vehicle'

describe('UpdateVehicleUseCase', () => {
  let vehicleRepository: InMemoryVehicleRepository
  let sut: UpdateVehicleUseCase

  beforeEach(() => {
    vehicleRepository = new InMemoryVehicleRepository()
    sut = new UpdateVehicleUseCase(vehicleRepository)
  })

  it('should update a vehicle of the user', async () => {
    const vehicle = makeVehicle()
    vehicleRepository.items.push(vehicle)

    const name = faker.vehicle.model()

    const result = await sut.execute(vehicle.userId, vehicle.id, {
      name,
      isActive: false
    })

    expect(result.isRight()).toBe(true)
    expect(vehicleRepository.items[0].name).toBe(name)
    expect(vehicleRepository.items[0].isActive).toBe(false)
  })

  it('should not update the vehicle of another user', async () => {
    const vehicle = makeVehicle()
    const name = vehicle.name
    vehicleRepository.items.push(vehicle)

    const result = await sut.execute(
      faker.string.alphanumeric(32),
      vehicle.id,
      {
        name: faker.vehicle.model()
      }
    )

    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(VehicleNotFoundError)
    expect(vehicleRepository.items[0].name).toBe(name)
  })

  it('should return PayloadError for an invalid update', async () => {
    const vehicle = makeVehicle({
      initialOdometerKm: 10_000,
      currentOdometerKm: 20_000
    })
    vehicleRepository.items.push(vehicle)

    const result = await sut.execute(vehicle.userId, vehicle.id, {
      currentOdometerKm: 5_000
    })

    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(PayloadError)
    expect(vehicleRepository.items[0].currentOdometerKm).toBe(20_000)
  })
})
