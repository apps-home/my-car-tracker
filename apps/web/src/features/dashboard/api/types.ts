import type { ExpenseCategory } from '@/features/expenses/api/types'

import type { CostSeriesKey } from '../utils/monthly-costs'

export interface AnalyticsOverviewParams {
	vehicleId: string
	from?: string
	to?: string
	year?: number
	month?: number
}

export interface MonthlyCostsParams {
	vehicleId: string
	year?: number
}

export interface CostSeriesBreakdown {
	series: CostSeriesKey
	totalAmount: number
	count: number
	sharePercent: number
}

export interface ExpenseCategoryBreakdown {
	category: ExpenseCategory
	series: CostSeriesKey
	totalAmount: number
	count: number
	sharePercent: number
}

export interface MaintenanceCostBreakdown {
	count: number
	totalAmount: number
	laborCost: number
	partsCost: number
	preventiveCost: number
	correctiveCost: number
	inspectionCost: number
}

export interface AnalyticsOverview {
	vehicleId: string
	totalCost: number
	totalFuelReimbursed: number
	netTotalCost: number
	totalEntriesCount: number
	activeMonthsCount: number
	monthlyAverageCost: number | null
	distanceDrivenKm: number
	totalCostPerKm: number | null
	fuelCostPerKm: number | null
	consumptionKmPerLiter: number | null
	ethanolParity: number | null
	totalFuelLiters: number
	bySeries: CostSeriesBreakdown[]
	byExpenseCategory: ExpenseCategoryBreakdown[]
	maintenanceBreakdown: MaintenanceCostBreakdown
}

export interface MonthlyCostBucket {
	month: number
	total: number
	count: number
	fuel: number
	road: number
	taxes: number
	other: number
	maintenance: number
}

export interface MonthlyCostsResponse {
	vehicleId: string
	year: number
	yearTotal: number
	monthlyAverage: number | null
	months: MonthlyCostBucket[]
}

