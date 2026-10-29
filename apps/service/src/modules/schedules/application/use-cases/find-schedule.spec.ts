import { faker } from '@faker-js/faker'
import { makeSchedule } from '@test/factories/make-schedule'
import { makeVehicle } from '@test/factories/make-vehicle'
import { InMemoryScheduleRepository } from '@test/repositories/in-memory-schedule.repository'
import { InMemoryVehicleRepository } from '@test/repositories/in-memory-vehicle.repository'
import { beforeEach, describe, expect, it } from 'vitest'

import { ScheduleNotFoundError } from '../errors/schedule-not-found.error'
import { FindScheduleByIdUseCase } from './find-schedule'

describe('FindScheduleByIdUseCase', () => {
  let scheduleRepository: InMemoryScheduleRepository
  let vehicleRepository: InMemoryVehicleRepository
  let sut: FindScheduleByIdUseCase

  beforeEach(() => {
    scheduleRepository = new InMemoryScheduleRepository()
    vehicleRepository = new InMemoryVehicleRepository()
    sut = new FindScheduleByIdUseCase(scheduleRepository, vehicleRepository)
  })

  it('should find a schedule of the user with the remaining km', async () => {
    const vehicle = makeVehicle({
      initialOdometerKm: 0,
      currentOdometerKm: 35_000
    })
    vehicleRepository.items.push(vehicle)
    const schedule = makeSchedule({
      userId: vehicle.userId,
      vehicleId: vehicle.id,
      lastExecutedOdometerKm: 30_000
    })
    scheduleRepository.items.push(schedule)

    const result = await sut.execute(vehicle.userId, schedule.id)

    expect(result.isRight()).toBe(true)
    if (result.isRight()) {
      expect(result.value.kmRemaining).toBe(5_000)
    }
  })

  it('should not find the schedule of another user', async () => {
    const schedule = makeSchedule()
    scheduleRepository.items.push(schedule)

    const result = await sut.execute(faker.string.alphanumeric(32), schedule.id)

    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(ScheduleNotFoundError)
  })
})
