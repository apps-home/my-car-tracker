import { faker } from '@faker-js/faker'
import { makeExpense } from '@test/factories/make-expense'
import { makeVehicle } from '@test/factories/make-vehicle'
import { InMemoryExpenseRepository } from '@test/repositories/in-memory-expense.repository'
import { InMemoryVehicleRepository } from '@test/repositories/in-memory-vehicle.repository'
import { beforeEach, describe, expect, it } from 'vitest'

import { addDaysUtc, startOfDayUtc } from '@/core/utils/utc-date'
import { VehicleNotFoundError } from '@/modules/vehicles/application/errors/vehicle-not-found.error'
import type { Vehicle } from '@/modules/vehicles/domain/vehicle.entity'

import { ListExpenseSuggestionsUseCase } from './list-expense-suggestions'

describe('ListExpenseSuggestionsUseCase', () => {
  let expenseRepository: InMemoryExpenseRepository
  let vehicleRepository: InMemoryVehicleRepository
  let sut: ListExpenseSuggestionsUseCase
  let vehicle: Vehicle

  beforeEach(() => {
    expenseRepository = new InMemoryExpenseRepository()
    vehicleRepository = new InMemoryVehicleRepository()
    sut = new ListExpenseSuggestionsUseCase(
      expenseRepository,
      vehicleRepository
    )

    vehicle = makeVehicle()
    vehicleRepository.items.push(vehicle)
  })

  it('should suggest the recent repeated expenses of the vehicle', async () => {
    const today = startOfDayUtc(new Date())
    const toll = {
      vehicleId: vehicle.id,
      userId: vehicle.userId,
      category: 'TOLL' as const,
      description: faker.location.street(),
      amount: 9.8
    }

    expenseRepository.items.push(
      makeExpense({ ...toll, date: addDaysUtc(today, -2) }),
      makeExpense({ ...toll, date: addDaysUtc(today, -9) }),
      // Fora da janela de 180 dias
      makeExpense({ ...toll, date: addDaysUtc(today, -400) }),
      // Outro veículo do mesmo usuário
      makeExpense({ ...toll, vehicleId: faker.string.uuid() })
    )

    const result = await sut.execute({
      userId: vehicle.userId,
      vehicleId: vehicle.id
    })

    expect(result.isRight()).toBe(true)
    if (result.isRight()) {
      expect(result.value).toHaveLength(1)
      expect(result.value[0]).toMatchObject({ category: 'TOLL', count: 2 })
    }
  })

  it('should not suggest for a vehicle of another user', async () => {
    const result = await sut.execute({
      userId: faker.string.alphanumeric(32),
      vehicleId: vehicle.id
    })

    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(VehicleNotFoundError)
  })
})
