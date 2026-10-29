import { Module } from '@nestjs/common'

import { ExpenseModule } from '../expenses/expense.module'
import { FuelLogModule } from '../fuel-logs/fuel-log.module'
import { MaintenanceModule } from '../maintenances/maintenance.module'
import { VehicleModule } from '../vehicles/vehicle.module'
import { GetAnalyticsOverviewUseCase } from './application/use-cases/get-analytics-overview'
import { GetMonthlyCostsUseCase } from './application/use-cases/get-monthly-costs'
import { AnalyticsController } from './infra/analytics.controller'

@Module({
	imports: [VehicleModule, FuelLogModule, ExpenseModule, MaintenanceModule],
	controllers: [AnalyticsController],
	providers: [GetAnalyticsOverviewUseCase, GetMonthlyCostsUseCase]
})
export class AnalyticsModule {}

