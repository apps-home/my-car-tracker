import { makeExpense } from '@test/factories/make-expense'
import { makeFuelLog } from '@test/factories/make-fuel-log'
import { makeMaintenance } from '@test/factories/make-maintenance'
import { makeVehicle } from '@test/factories/make-vehicle'
import { InMemoryExpenseRepository } from '@test/repositories/in-memory-expense.repository'
import { InMemoryFuelLogRepository } from '@test/repositories/in-memory-fuel-log.repository'
import { InMemoryMaintenanceRepository } from '@test/repositories/in-memory-maintenance.repository'
import { InMemoryVehicleRepository } from '@test/repositories/in-memory-vehicle.repository'
import { beforeEach, describe, expect, it } from 'vitest'

import { VehicleNotFoundError } from '@/modules/vehicles/application/errors/vehicle-not-found.error'

import { GetMonthlyCostsUseCase } from './get-monthly-costs'

describe('GetMonthlyCostsUseCase', () => {
	let vehicleRepository: InMemoryVehicleRepository
	let fuelLogRepository: InMemoryFuelLogRepository
	let expenseRepository: InMemoryExpenseRepository
	let maintenanceRepository: InMemoryMaintenanceRepository
	let sut: GetMonthlyCostsUseCase

	beforeEach(() => {
		vehicleRepository = new InMemoryVehicleRepository()
		fuelLogRepository = new InMemoryFuelLogRepository()
		expenseRepository = new InMemoryExpenseRepository()
		maintenanceRepository = new InMemoryMaintenanceRepository()
		sut = new GetMonthlyCostsUseCase(
			vehicleRepository,
			fuelLogRepository,
			expenseRepository,
			maintenanceRepository
		)
	})

	it('returns 12 monthly cost buckets for the requested year', async () => {
		const userId = 'user-1'
		const vehicle = makeVehicle({ userId })
		await vehicleRepository.create(vehicle)

		await fuelLogRepository.create(
			makeFuelLog({
				userId,
				vehicleId: vehicle.id,
				date: new Date('2026-04-10T00:00:00Z'),
				odometerKm: 15_000,
				liters: 40,
				pricePerLiter: 5.5,
				totalCost: 220
			})
		)
		await expenseRepository.create(
			makeExpense({
				userId,
				vehicleId: vehicle.id,
				category: 'TOLL',
				date: new Date('2026-04-12T00:00:00Z'),
				amount: 25
			})
		)
		await maintenanceRepository.create(
			makeMaintenance(userId, {
				vehicleId: vehicle.id,
				date: new Date('2026-05-05T00:00:00Z'),
				odometerKm: 15_500,
				laborCost: 100,
				totalAmount: 300
			})
		)

		const result = await sut.execute({
			userId,
			vehicleId: vehicle.id,
			year: 2026
		})

		expect(result.isRight()).toBe(true)
		if (result.isRight()) {
			expect(result.value.year).toBe(2026)
			expect(result.value.yearTotal).toBe(545)
			expect(result.value.months[3]).toMatchObject({
				month: 4,
				fuel: 220,
				road: 25,
				total: 245,
				count: 2
			})
			expect(result.value.months[4]).toMatchObject({
				month: 5,
				maintenance: 300,
				total: 300,
				count: 1
			})
		}
	})

	it('returns VehicleNotFoundError when vehicle belongs to another user', async () => {
		const vehicle = makeVehicle({ userId: 'owner-user' })
		await vehicleRepository.create(vehicle)

		const result = await sut.execute({
			userId: 'other-user',
			vehicleId: vehicle.id,
			year: 2026
		})

		expect(result.isLeft()).toBe(true)
		expect(result.value).toBeInstanceOf(VehicleNotFoundError)
	})
})
