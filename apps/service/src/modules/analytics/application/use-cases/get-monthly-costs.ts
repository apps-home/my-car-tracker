import { Injectable } from '@nestjs/common'

import { Either, left, right } from '@/core/utils/Either'
import { todayInTimeZone } from '@/core/utils/utc-date'
import { ExpenseRepository } from '@/modules/expenses/domain/expense.repository'
import { FuelLogRepository } from '@/modules/fuel-logs/domain/fuel-log.repository'
import { MaintenanceRepository } from '@/modules/maintenances/domain/maintenance.repository'
import { VehicleNotFoundError } from '@/modules/vehicles/application/errors/vehicle-not-found.error'
import { VehicleRepository } from '@/modules/vehicles/domain/vehicle.repository'

import type { MonthlyCostsSummary } from '../../domain/analytics-types'
import type { MonthlyCostsParams } from '../../domain/dto/analytics.payload'
import { calculateMonthlyCosts } from '../../domain/tco-calculator'

type Response = Either<VehicleNotFoundError, MonthlyCostsSummary>

@Injectable()
export class GetMonthlyCostsUseCase {
	constructor(
		private vehicleRepository: VehicleRepository,
		private fuelLogRepository: FuelLogRepository,
		private expenseRepository: ExpenseRepository,
		private maintenanceRepository: MaintenanceRepository
	) {}

	async execute({
		userId,
		vehicleId,
		year
	}: MonthlyCostsParams): Promise<Response> {
		const vehicle = await this.vehicleRepository.findById(vehicleId, userId)

		if (!vehicle) {
			return left(new VehicleNotFoundError())
		}

		const targetYear = year ?? todayInTimeZone().getUTCFullYear()

		const [fuelLogs, expenses, maintenances] = await Promise.all([
			this.fuelLogRepository.list({ userId, vehicleId, year: targetYear }),
			this.expenseRepository.list({ userId, vehicleId, year: targetYear }),
			this.maintenanceRepository.list({ userId, vehicleId, year: targetYear })
		])

		return right(
			calculateMonthlyCosts({
				vehicleId,
				year: targetYear,
				fuelLogs,
				expenses,
				maintenances
			})
		)
	}
}

