import { faker } from '@faker-js/faker'
import { makeFuelLog } from '@test/factories/make-fuel-log'
import { InMemoryFuelLogRepository } from '@test/repositories/in-memory-fuel-log.repository'
import { beforeEach, describe, expect, it } from 'vitest'

import { FuelLogNotFoundError } from '../errors/fuel-log-not-found.error'
import { FindFuelLogByIdUseCase } from './find-fuel-log'

describe('FindFuelLogByIdUseCase', () => {
  let fuelLogRepository: InMemoryFuelLogRepository
  let sut: FindFuelLogByIdUseCase

  beforeEach(() => {
    fuelLogRepository = new InMemoryFuelLogRepository()
    sut = new FindFuelLogByIdUseCase(fuelLogRepository)
  })

  it('should find a fuel log of the user', async () => {
    const fuelLog = makeFuelLog()
    fuelLogRepository.items.push(fuelLog)

    const result = await sut.execute(fuelLog.userId, fuelLog.id)

    expect(result.isRight()).toBe(true)
    if (result.isRight()) {
      expect(result.value.id).toBe(fuelLog.id)
      expect(result.value).not.toHaveProperty('userId')
    }
  })

  it('should not find the fuel log of another user', async () => {
    const fuelLog = makeFuelLog()
    fuelLogRepository.items.push(fuelLog)

    const result = await sut.execute(faker.string.alphanumeric(32), fuelLog.id)

    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(FuelLogNotFoundError)
  })
})
