import { faker } from '@faker-js/faker'
import { makeFuelLog } from '@test/factories/make-fuel-log'
import { InMemoryFuelLogRepository } from '@test/repositories/in-memory-fuel-log.repository'
import { beforeEach, describe, expect, it } from 'vitest'

import { FuelLogNotFoundError } from '../errors/fuel-log-not-found.error'
import { DeleteFuelLogUseCase } from './delete-fuel-log'

describe('DeleteFuelLogUseCase', () => {
  let fuelLogRepository: InMemoryFuelLogRepository
  let sut: DeleteFuelLogUseCase
  const vehicleId = faker.string.uuid()
  const userId = faker.string.alphanumeric(32)

  beforeEach(() => {
    fuelLogRepository = new InMemoryFuelLogRepository()
    sut = new DeleteFuelLogUseCase(fuelLogRepository)
  })

  function existingLog(odometerKm: number, date: string) {
    const fuelLog = makeFuelLog({
      vehicleId,
      userId,
      odometerKm,
      date: new Date(date),
      liters: 40
    })
    fuelLogRepository.items.push(fuelLog)
    return fuelLog
  }

  it('should delete the fuel log and recalculate the next one', async () => {
    existingLog(10_000, '2026-03-01')
    const middle = existingLog(10_300, '2026-03-05')
    const last = existingLog(10_800, '2026-03-10')

    const result = await sut.execute(userId, middle.id)

    expect(result.isRight()).toBe(true)
    expect(fuelLogRepository.items).toHaveLength(2)
    expect(fuelLogRepository.byId(last.id)?.distanceDrivenKm).toBe(800)
    expect(fuelLogRepository.byId(last.id)?.consumptionKmPerLiter).toBe(20)
  })

  it('should not delete the fuel log of another user', async () => {
    const fuelLog = existingLog(10_000, '2026-03-01')

    const result = await sut.execute(faker.string.alphanumeric(32), fuelLog.id)

    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(FuelLogNotFoundError)
    expect(fuelLogRepository.items).toHaveLength(1)
  })
})
