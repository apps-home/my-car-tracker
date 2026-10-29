import { faker } from '@faker-js/faker'
import { makeSchedulePayload } from '@test/factories/make-schedule'
import { makeVehicle } from '@test/factories/make-vehicle'
import { InMemoryScheduleRepository } from '@test/repositories/in-memory-schedule.repository'
import { InMemoryVehicleRepository } from '@test/repositories/in-memory-vehicle.repository'
import { beforeEach, describe, expect, it } from 'vitest'

import { PayloadError } from '@/core/domain/errors/payload-error'
import { VehicleNotFoundError } from '@/modules/vehicles/application/errors/vehicle-not-found.error'
import type { Vehicle } from '@/modules/vehicles/domain/vehicle.entity'

import { CreateScheduleUseCase } from './create-schedule'

describe('CreateScheduleUseCase', () => {
  let scheduleRepository: InMemoryScheduleRepository
  let vehicleRepository: InMemoryVehicleRepository
  let sut: CreateScheduleUseCase
  let vehicle: Vehicle

  beforeEach(() => {
    scheduleRepository = new InMemoryScheduleRepository()
    vehicleRepository = new InMemoryVehicleRepository()
    sut = new CreateScheduleUseCase(scheduleRepository, vehicleRepository)

    vehicle = makeVehicle({ initialOdometerKm: 0, currentOdometerKm: 50_000 })
    vehicleRepository.items.push(vehicle)
  })

  it('should create the schedule starting at the current km', async () => {
    const result = await sut.execute(
      vehicle.userId,
      makeSchedulePayload({ vehicleId: vehicle.id, intervalKm: 10_000 })
    )

    expect(result.isRight()).toBe(true)
    expect(scheduleRepository.items).toHaveLength(1)
    expect(scheduleRepository.items[0].nextDueOdometerKm).toBe(60_000)
    if (result.isRight()) {
      expect(result.value.kmRemaining).toBe(10_000)
      expect(result.value.alertStatus).toBe('ON_TRACK')
    }
  })

  it('should store the status of an already overdue schedule', async () => {
    const result = await sut.execute(
      vehicle.userId,
      makeSchedulePayload({
        vehicleId: vehicle.id,
        intervalKm: 10_000,
        lastExecutedAt: new Date('2026-01-01'),
        lastExecutedOdometerKm: 38_000
      })
    )

    expect(result.isRight()).toBe(true)
    expect(scheduleRepository.items[0].alertStatus).toBe('OVERDUE')
  })

  it('should reject a last execution above the current km', async () => {
    const result = await sut.execute(
      vehicle.userId,
      makeSchedulePayload({
        vehicleId: vehicle.id,
        lastExecutedOdometerKm: 51_000
      })
    )

    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(PayloadError)
    expect(scheduleRepository.items).toHaveLength(0)
  })

  it('should not create a schedule for a vehicle of another user', async () => {
    const result = await sut.execute(
      faker.string.alphanumeric(32),
      makeSchedulePayload({ vehicleId: vehicle.id })
    )

    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(VehicleNotFoundError)
    expect(scheduleRepository.items).toHaveLength(0)
  })
})
