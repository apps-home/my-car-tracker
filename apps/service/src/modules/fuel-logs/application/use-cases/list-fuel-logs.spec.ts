import { faker } from '@faker-js/faker'
import { makeFuelLog } from '@test/factories/make-fuel-log'
import { InMemoryFuelLogRepository } from '@test/repositories/in-memory-fuel-log.repository'
import { beforeEach, describe, expect, it } from 'vitest'

import { ListFuelLogsUseCase } from './list-fuel-logs'

describe('ListFuelLogsUseCase', () => {
  let fuelLogRepository: InMemoryFuelLogRepository
  let sut: ListFuelLogsUseCase
  const userId = faker.string.alphanumeric(32)
  const vehicleId = faker.string.uuid()

  beforeEach(() => {
    fuelLogRepository = new InMemoryFuelLogRepository()
    sut = new ListFuelLogsUseCase(fuelLogRepository)

    fuelLogRepository.items.push(
      makeFuelLog({
        userId,
        vehicleId,
        fuelType: 'ETHANOL',
        date: new Date('2026-02-10')
      }),
      makeFuelLog({
        userId,
        vehicleId,
        fuelType: 'GASOLINE_COMMON',
        date: new Date('2026-03-10')
      }),
      makeFuelLog({ userId, date: new Date('2026-03-12') }),
      makeFuelLog({ date: new Date('2026-03-11') })
    )
  })

  it('should list only the fuel logs of the user, newest first', async () => {
    const result = await sut.execute({ userId })

    expect(result.value).toHaveLength(3)
    expect(
      result.value.map(({ date }) => date.toISOString().slice(0, 10))
    ).toEqual(['2026-03-12', '2026-03-10', '2026-02-10'])
  })

  it('should filter by vehicle, fuel type and month', async () => {
    expect(
      (await sut.execute({ userId, vehicleId, fuelType: 'ETHANOL' })).value
    ).toHaveLength(1)
    expect(
      (await sut.execute({ userId, vehicleId, year: 2026, month: 3 })).value
    ).toHaveLength(1)
  })
})
