import { faker } from '@faker-js/faker'
import { makeVehiclePayload } from '@test/factories/make-vehicle'
import { InMemoryVehicleRepository } from '@test/repositories/in-memory-vehicle.repository'
import { beforeEach, describe, expect, it } from 'vitest'

import { PayloadError } from '@/core/domain/errors/payload-error'

import { CreateVehicleUseCase } from './create-vehicle'

describe('CreateVehicleUseCase', () => {
  let vehicleRepository: InMemoryVehicleRepository
  let sut: CreateVehicleUseCase

  beforeEach(() => {
    vehicleRepository = new InMemoryVehicleRepository()
    sut = new CreateVehicleUseCase(vehicleRepository)
  })

  it('should create a vehicle for the user', async () => {
    const userId = faker.string.alphanumeric(32)

    const payload = makeVehiclePayload({ defaultFuelType: 'ETHANOL' })

    const result = await sut.execute(userId, payload)

    expect(result.isRight()).toBe(true)
    expect(vehicleRepository.items).toHaveLength(1)
    expect(vehicleRepository.items[0].userId).toBe(userId)
    if (result.isRight()) {
      expect(result.value.id).toBe(vehicleRepository.items[0].id)
      expect(result.value.name).toBe(payload.name)
      expect(result.value.defaultFuelType).toBe('ETHANOL')
      expect(result.value).not.toHaveProperty('userId')
    }
  })

  it('should return PayloadError for an invalid vehicle', async () => {
    const result = await sut.execute(
      faker.string.alphanumeric(32),
      makeVehiclePayload({ licensePlate: 'invalid' })
    )

    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(PayloadError)
    expect(vehicleRepository.items).toHaveLength(0)
  })
})
