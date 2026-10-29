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

import { GetAnalyticsOverviewUseCase } from './get-analytics-overview'

describe('GetAnalyticsOverviewUseCase', () => {
	let vehicleRepository: InMemoryVehicleRepository
	let fuelLogRepository: InMemoryFuelLogRepository
	let expenseRepository: InMemoryExpenseRepository
	let maintenanceRepository: InMemoryMaintenanceRepository
	let sut: GetAnalyticsOverviewUseCase

	beforeEach(() => {
		vehicleRepository = new InMemoryVehicleRepository()
		fuelLogRepository = new InMemoryFuelLogRepository()
		expenseRepository = new InMemoryExpenseRepository()
		maintenanceRepository = new InMemoryMaintenanceRepository()
		sut = new GetAnalyticsOverviewUseCase(
			vehicleRepository,
			fuelLogRepository,
			expenseRepository,
			maintenanceRepository
		)
	})

	it('returns consolidated TCO overview for the user vehicle', async () => {
		const userId = 'user-1'
		const vehicle = makeVehicle({
			userId,
			initialOdometerKm: 20_000,
			currentOdometerKm: 22_000
		})
		await vehicleRepository.create(vehicle)

		await fuelLogRepository.create(
			makeFuelLog({
				userId,
				vehicleId: vehicle.id,
				date: new Date('2026-01-10T00:00:00Z'),
				odometerKm: 20_500,
				liters: 40,
				pricePerLiter: 5.5,
				totalCost: 220
			})
		)
		await expenseRepository.create(
			makeExpense({
				userId,
				vehicleId: vehicle.id,
				category: 'PARKING',
				date: new Date('2026-01-12T00:00:00Z'),
				amount: 30,
				description: 'Estacionamento'
			})
		)
		await maintenanceRepository.create(
			makeMaintenance(userId, {
				vehicleId: vehicle.id,
				date: new Date('2026-02-01T00:00:00Z'),
				odometerKm: 21_500,
				laborCost: 150,
				totalAmount: 450
			})
		)

		const result = await sut.execute({
			userId,
			vehicleId: vehicle.id
		})

		expect(result.isRight()).toBe(true)
		if (result.isRight()) {
			expect(result.value.totalCost).toBe(700)
			expect(result.value.totalEntriesCount).toBe(3)
			expect(result.value.distanceDrivenKm).toBe(2000)
			expect(result.value.totalCostPerKm).toBe(0.35)
		}
	})

	it('returns VehicleNotFoundError when vehicle belongs to another user', async () => {
		const vehicle = makeVehicle({ userId: 'owner-user' })
		await vehicleRepository.create(vehicle)

		const result = await sut.execute({
			userId: 'other-user',
			vehicleId: vehicle.id
		})

		expect(result.isLeft()).toBe(true)
		expect(result.value).toBeInstanceOf(VehicleNotFoundError)
	})
})
