import { Type } from 'class-transformer'
import { IsInt, IsOptional, IsUUID, Max, Min } from 'class-validator'

import { PeriodQueryDTO } from '@/infra/http/period-query.dto'

export class AnalyticsOverviewQueryDTO extends PeriodQueryDTO {
	@IsUUID('4')
	vehicleId: string
}

export class MonthlyCostsQueryDTO {
	@IsUUID('4')
	vehicleId: string

	@IsOptional()
	@Type(() => Number)
	@IsInt()
	@Min(1900)
	@Max(3000)
	year?: number
}

