import { faker } from '@faker-js/faker'
import { makeSchedule } from '@test/factories/make-schedule'
import { makeVehicle } from '@test/factories/make-vehicle'
import { InMemoryScheduleRepository } from '@test/repositories/in-memory-schedule.repository'
import { InMemoryVehicleRepository } from '@test/repositories/in-memory-vehicle.repository'
import { beforeEach, describe, expect, it } from 'vitest'

import { PayloadError } from '@/core/domain/errors/payload-error'
import type { Vehicle } from '@/modules/vehicles/domain/vehicle.entity'

import { ScheduleNotFoundError } from '../errors/schedule-not-found.error'
import { UpdateScheduleUseCase } from './update-schedule'

describe('UpdateScheduleUseCase', () => {
  let scheduleRepository: InMemoryScheduleRepository
  let vehicleRepository: InMemoryVehicleRepository
  let sut: UpdateScheduleUseCase
  let vehicle: Vehicle

  beforeEach(() => {
    scheduleRepository = new InMemoryScheduleRepository()
    vehicleRepository = new InMemoryVehicleRepository()
    sut = new UpdateScheduleUseCase(scheduleRepository, vehicleRepository)

    vehicle = makeVehicle({ initialOdometerKm: 0, currentOdometerKm: 40_000 })
    vehicleRepository.items.push(vehicle)
  })

  function existing() {
    const schedule = makeSchedule({
      userId: vehicle.userId,
      vehicleId: vehicle.id,
      lastExecutedOdometerKm: 35_000
    })
    scheduleRepository.items.push(schedule)
    return schedule
  }

  it('should update, recalculate and evaluate the schedule', async () => {
    const schedule = existing()

    const result = await sut.execute(vehicle.userId, schedule.id, {
      intervalKm: 5_000
    })

    expect(result.isRight()).toBe(true)
    expect(scheduleRepository.byId(schedule.id)?.nextDueOdometerKm).toBe(40_000)
    expect(scheduleRepository.byId(schedule.id)?.alertStatus).toBe('OVERDUE')
  })

  it('should deactivate a schedule', async () => {
    const schedule = existing()

    await sut.execute(vehicle.userId, schedule.id, { isActive: false })

    expect(scheduleRepository.byId(schedule.id)?.isActive).toBe(false)
  })

  it('should reject invalid values without changing anything', async () => {
    const schedule = existing()

    const result = await sut.execute(vehicle.userId, schedule.id, {
      lastExecutedOdometerKm: 99_000
    })

    expect(result.value).toBeInstanceOf(PayloadError)
    expect(scheduleRepository.byId(schedule.id)?.lastExecutedOdometerKm).toBe(
      35_000
    )
  })

  it('should not update the schedule of another user', async () => {
    const schedule = existing()

    const result = await sut.execute(
      faker.string.alphanumeric(32),
      schedule.id,
      {
        title: faker.commerce.productName()
      }
    )

    expect(result.value).toBeInstanceOf(ScheduleNotFoundError)
    expect(scheduleRepository.byId(schedule.id)?.title).toBe(schedule.title)
  })
})
