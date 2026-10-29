import { faker } from '@faker-js/faker'
import { makeSchedule } from '@test/factories/make-schedule'
import { makeVehicle } from '@test/factories/make-vehicle'
import { InMemoryScheduleRepository } from '@test/repositories/in-memory-schedule.repository'
import { InMemoryVehicleRepository } from '@test/repositories/in-memory-vehicle.repository'
import { beforeEach, describe, expect, it } from 'vitest'

import { todayInTimeZone } from '@/core/utils/utc-date'

import { ListSchedulesUseCase } from './list-schedules'

describe('ListSchedulesUseCase', () => {
  let scheduleRepository: InMemoryScheduleRepository
  let vehicleRepository: InMemoryVehicleRepository
  let sut: ListSchedulesUseCase
  const userId = faker.string.alphanumeric(32)

  beforeEach(() => {
    scheduleRepository = new InMemoryScheduleRepository()
    vehicleRepository = new InMemoryVehicleRepository()
    sut = new ListSchedulesUseCase(scheduleRepository, vehicleRepository)

    const vehicle = makeVehicle({
      userId,
      initialOdometerKm: 0,
      currentOdometerKm: 40_000
    })
    vehicleRepository.items.push(vehicle)

    const today = todayInTimeZone()
    const base = { userId, vehicleId: vehicle.id, lastExecutedAt: today }

    scheduleRepository.items.push(
      // Gravado como ON_TRACK, mas o km atual já passou: vem OVERDUE
      makeSchedule({
        ...base,
        title: 'Vencido',
        lastExecutedOdometerKm: 29_000
      }),
      makeSchedule({
        ...base,
        title: 'Em dia',
        lastExecutedOdometerKm: 39_000
      }),
      makeSchedule({
        ...base,
        title: 'Próximo',
        lastExecutedOdometerKm: 30_200
      }),
      makeSchedule({ ...base, title: 'Inativo', isActive: false }),
      makeSchedule({ title: 'De outro usuário' })
    )
  })

  it('should evaluate now and order by severity', async () => {
    const result = await sut.execute({ userId })

    expect(
      result.value.map(({ title, alertStatus }) => [title, alertStatus])
    ).toEqual([
      ['Vencido', 'OVERDUE'],
      ['Próximo', 'DUE_SOON'],
      ['Em dia', 'ON_TRACK']
    ])
    expect(result.value[0].kmRemaining).toBe(-1_000)
    expect(result.value[0]).not.toHaveProperty('userId')
  })

  it('should filter by the evaluated status and include inactive on request', async () => {
    expect(
      (await sut.execute({ userId, alertStatus: 'DUE_SOON' })).value
    ).toHaveLength(1)
    expect(
      (await sut.execute({ userId, includeInactive: true })).value
    ).toHaveLength(4)
  })
})
