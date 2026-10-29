import { faker } from '@faker-js/faker'
import { FakeEventPublisher } from '@test/events/fake-event-publisher'
import { makeExpense } from '@test/factories/make-expense'
import { makeVehicle } from '@test/factories/make-vehicle'
import { InMemoryExpenseRepository } from '@test/repositories/in-memory-expense.repository'
import { InMemoryVehicleRepository } from '@test/repositories/in-memory-vehicle.repository'
import { beforeEach, describe, expect, it } from 'vitest'

import { PayloadError } from '@/core/domain/errors/payload-error'
import { SyncVehicleOdometerService } from '@/modules/vehicles/application/services/sync-vehicle-odometer'
import type { Vehicle } from '@/modules/vehicles/domain/vehicle.entity'

import { ExpenseNotFoundError } from '../errors/expense-not-found.error'
import { UpdateExpenseUseCase } from './update-expense'

describe('UpdateExpenseUseCase', () => {
  let expenseRepository: InMemoryExpenseRepository
  let vehicleRepository: InMemoryVehicleRepository
  let sut: UpdateExpenseUseCase
  let vehicle: Vehicle

  beforeEach(() => {
    expenseRepository = new InMemoryExpenseRepository()
    vehicleRepository = new InMemoryVehicleRepository()
    sut = new UpdateExpenseUseCase(
      expenseRepository,
      vehicleRepository,
      new SyncVehicleOdometerService(
        vehicleRepository,
        new FakeEventPublisher()
      )
    )

    vehicle = makeVehicle({
      initialOdometerKm: 10_000,
      currentOdometerKm: 20_000
    })
    vehicleRepository.items.push(vehicle)
  })

  function existingExpense() {
    const expense = makeExpense({
      vehicleId: vehicle.id,
      userId: vehicle.userId
    })
    expenseRepository.items.push(expense)
    return expense
  }

  it('should update the expense and sync the odometer', async () => {
    const expense = existingExpense()

    const result = await sut.execute(vehicle.userId, expense.id, {
      amount: 99.9,
      odometerKm: 21_000
    })

    expect(result.isRight()).toBe(true)
    expect(expenseRepository.items[0].amount).toBe(99.9)
    expect(vehicleRepository.items[0].currentOdometerKm).toBe(21_000)
  })

  it('should not update the expense of another user', async () => {
    const expense = existingExpense()

    const result = await sut.execute(
      faker.string.alphanumeric(32),
      expense.id,
      {
        amount: 1
      }
    )

    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(ExpenseNotFoundError)
    expect(expenseRepository.items[0].amount).toBe(expense.amount)
  })

  it('should reject an invalid odometer without changing anything', async () => {
    const expense = existingExpense()

    const result = await sut.execute(vehicle.userId, expense.id, {
      odometerKm: 1_000
    })

    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(PayloadError)
    expect(expenseRepository.items[0].odometerKm).toBeNull()
  })
})
