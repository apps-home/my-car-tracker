import { faker } from '@faker-js/faker'
import { FakeEventPublisher } from '@test/events/fake-event-publisher'
import { makeExpensePayload } from '@test/factories/make-expense'
import { makeVehicle } from '@test/factories/make-vehicle'
import { InMemoryExpenseRepository } from '@test/repositories/in-memory-expense.repository'
import { InMemoryVehicleRepository } from '@test/repositories/in-memory-vehicle.repository'
import { beforeEach, describe, expect, it } from 'vitest'

import { PayloadError } from '@/core/domain/errors/payload-error'
import { VehicleNotFoundError } from '@/modules/vehicles/application/errors/vehicle-not-found.error'
import { SyncVehicleOdometerService } from '@/modules/vehicles/application/services/sync-vehicle-odometer'
import type { Vehicle } from '@/modules/vehicles/domain/vehicle.entity'

import { CreateExpenseUseCase } from './create-expense'

describe('CreateExpenseUseCase', () => {
  let expenseRepository: InMemoryExpenseRepository
  let vehicleRepository: InMemoryVehicleRepository
  let eventPublisher: FakeEventPublisher
  let sut: CreateExpenseUseCase
  let vehicle: Vehicle

  beforeEach(() => {
    expenseRepository = new InMemoryExpenseRepository()
    vehicleRepository = new InMemoryVehicleRepository()
    eventPublisher = new FakeEventPublisher()
    sut = new CreateExpenseUseCase(
      expenseRepository,
      vehicleRepository,
      new SyncVehicleOdometerService(vehicleRepository, eventPublisher)
    )

    vehicle = makeVehicle({
      initialOdometerKm: 10_000,
      currentOdometerKm: 20_000
    })
    vehicleRepository.items.push(vehicle)
  })

  it('should create the expense without touching the odometer', async () => {
    const payload = makeExpensePayload({ vehicleId: vehicle.id })

    const result = await sut.execute(vehicle.userId, payload)

    expect(result.isRight()).toBe(true)
    expect(expenseRepository.items).toHaveLength(1)
    expect(expenseRepository.items[0].description).toBe(payload.description)
    expect(eventPublisher.published).toHaveLength(0)
  })

  it('should sync the vehicle odometer when the expense has a higher km', async () => {
    await sut.execute(
      vehicle.userId,
      makeExpensePayload({ vehicleId: vehicle.id, odometerKm: 20_300 })
    )

    expect(vehicleRepository.items[0].currentOdometerKm).toBe(20_300)
    expect(eventPublisher.published).toHaveLength(1)
  })

  it('should reject an odometer below the vehicle initial odometer', async () => {
    const result = await sut.execute(
      vehicle.userId,
      makeExpensePayload({ vehicleId: vehicle.id, odometerKm: 5_000 })
    )

    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(PayloadError)
    expect(expenseRepository.items).toHaveLength(0)
  })

  it('should not create an expense for a vehicle of another user', async () => {
    const result = await sut.execute(
      faker.string.alphanumeric(32),
      makeExpensePayload({ vehicleId: vehicle.id })
    )

    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(VehicleNotFoundError)
    expect(expenseRepository.items).toHaveLength(0)
  })

  it('should return PayloadError for invalid values', async () => {
    const result = await sut.execute(
      vehicle.userId,
      makeExpensePayload({ vehicleId: vehicle.id, amount: -3 })
    )

    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(PayloadError)
  })
})
