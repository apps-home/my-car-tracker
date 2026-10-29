import { faker } from '@faker-js/faker'
import { makeVehicle } from '@test/factories/make-vehicle'
import { InMemoryVehicleRepository } from '@test/repositories/in-memory-vehicle.repository'
import { beforeEach, describe, expect, it } from 'vitest'

import { ListVehiclesUseCase } from './list-vehicles'

describe('ListVehiclesUseCase', () => {
  let vehicleRepository: InMemoryVehicleRepository
  let sut: ListVehiclesUseCase
  const userId = faker.string.alphanumeric(32)

  beforeEach(() => {
    vehicleRepository = new InMemoryVehicleRepository()
    sut = new ListVehiclesUseCase(vehicleRepository)

    vehicleRepository.items.push(
      makeVehicle({ userId, isActive: false }),
      makeVehicle({ userId }),
      makeVehicle()
    )
  })

  it('should list only the vehicles of the user, active first', async () => {
    const result = await sut.execute({ userId })

    expect(result.isRight()).toBe(true)
    expect(result.value).toHaveLength(2)
    expect(result.value.map((vehicle) => vehicle.isActive)).toEqual([
      true,
      false
    ])
  })

  it('should filter by status', async () => {
    const result = await sut.execute({ userId, status: 'INACTIVE' })

    expect(result.value).toHaveLength(1)
    expect(result.value[0].isActive).toBe(false)
  })
})
