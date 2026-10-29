import { CurrentUserId } from '@lib/auth/nest'
import { Controller, Get, Query } from '@nestjs/common'

import { toHttpException } from '@/infra/http/to-http-exception'

import { GetAnalyticsOverviewUseCase } from '../application/use-cases/get-analytics-overview'
import { GetMonthlyCostsUseCase } from '../application/use-cases/get-monthly-costs'
import {
	AnalyticsOverviewQueryDTO,
	MonthlyCostsQueryDTO
} from './analytics.dto'

@Controller('analytics')
export class AnalyticsController {
	constructor(
		private getAnalyticsOverviewUseCase: GetAnalyticsOverviewUseCase,
		private getMonthlyCostsUseCase: GetMonthlyCostsUseCase
	) {}

	@Get('overview')
	async overview(
		@Query() query: AnalyticsOverviewQueryDTO,
		@CurrentUserId() userId: string
	) {
		const result = await this.getAnalyticsOverviewUseCase.execute({
			userId,
			...query
		})

		if (result.isLeft()) {
			throw toHttpException(result.value)
		}

		return result.value
	}

	@Get('monthly-costs')
	async monthlyCosts(
		@Query() query: MonthlyCostsQueryDTO,
		@CurrentUserId() userId: string
	) {
		const result = await this.getMonthlyCostsUseCase.execute({
			userId,
			...query
		})

		if (result.isLeft()) {
			throw toHttpException(result.value)
		}

		return result.value
	}
}

