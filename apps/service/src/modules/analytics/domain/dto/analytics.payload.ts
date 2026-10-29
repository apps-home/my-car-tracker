import type { PeriodFilter } from '@/core/utils/date-range'

export interface AnalyticsOverviewParams extends PeriodFilter {
	userId: string
	vehicleId: string
}

export interface MonthlyCostsParams {
	userId: string
	vehicleId: string
	year?: number
}

