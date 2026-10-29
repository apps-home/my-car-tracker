import { Injectable } from '@nestjs/common'

import { toDateRange } from '@/core/utils/date-range'
import { Either, left, right } from '@/core/utils/Either'
import { ExpenseRepository } from '@/modules/expenses/domain/expense.repository'
import { FuelLogRepository } from '@/modules/fuel-logs/domain/fuel-log.repository'
import { MaintenanceRepository } from '@/modules/maintenances/domain/maintenance.repository'
import { VehicleNotFoundError } from '@/modules/vehicles/application/errors/vehicle-not-found.error'
import { VehicleRepository } from '@/modules/vehicles/domain/vehicle.repository'

import type { AnalyticsOverview } from '../../domain/analytics-types'
import type { AnalyticsOverviewParams } from '../../domain/dto/analytics.payload'
import { calculateAnalyticsOverview } from '../../domain/tco-calculator'

type Response = Either<VehicleNotFoundError, AnalyticsOverview>

@Injectable()
export class GetAnalyticsOverviewUseCase {
	constructor(
		private vehicleRepository: VehicleRepository,
		private fuelLogRepository: FuelLogRepository,
		private expenseRepository: ExpenseRepository,
		private maintenanceRepository: MaintenanceRepository
	) {}

	async execute({
		userId,
		vehicleId,
		...period
	}: AnalyticsOverviewParams): Promise<Response> {
		const vehicle = await this.vehicleRepository.findById(vehicleId, userId)

		if (!vehicle) {
			return left(new VehicleNotFoundError())
		}

		const [allFuelLogs, allExpenses, allMaintenances] = await Promise.all([
			this.fuelLogRepository.findAllByVehicle(vehicleId, userId),
			this.expenseRepository.list({ userId, vehicleId }),
			this.maintenanceRepository.list({ userId, vehicleId })
		])

		const range = toDateRange(period)

		return right(
			calculateAnalyticsOverview({
				vehicle,
				allFuelLogs,
				allExpenses,
				allMaintenances,
				range
			})
		)
	}
}

