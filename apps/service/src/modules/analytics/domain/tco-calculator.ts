import { type DateRange, isInDateRange } from '@/core/utils/date-range'
import { round } from '@/core/utils/round'
import {
	EXPENSE_CATEGORIES,
	type ExpenseCategory
} from '@/modules/expenses/domain/expense-category'
import type { Expense } from '@/modules/expenses/domain/expense.entity'
import {
	type ConsumptionResult,
	calculateConsumption
} from '@/modules/fuel-logs/domain/fuel-consumption'
import type { FuelLog } from '@/modules/fuel-logs/domain/fuel-log.entity'
import type { Maintenance } from '@/modules/maintenances/domain/maintenance.entity'
import type { FuelType } from '@/modules/vehicles/domain/fuel-type'
import type { Vehicle } from '@/modules/vehicles/domain/vehicle.entity'

import {
	type AnalyticsOverview,
	COST_SERIES_KEYS,
	type CostSeriesBreakdown,
	type CostSeriesKey,
	EXPENSE_CATEGORY_SERIES,
	type ExpenseCategoryBreakdown,
	type MaintenanceCostBreakdown,
	type MonthlyCostItem,
	type MonthlyCostsSummary
} from './analytics-types'

const GASOLINE_TYPES: FuelType[] = [
	'GASOLINE_COMMON',
	'GASOLINE_ADDITIVE',
	'GASOLINE_PREMIUM'
]

export interface CalculateOverviewInput {
	vehicle: Vehicle
	allFuelLogs: FuelLog[]
	allExpenses: Expense[]
	allMaintenances: Maintenance[]
	range: DateRange
}

export interface CalculateMonthlyCostsInput {
	vehicleId: string
	year: number
	fuelLogs: FuelLog[]
	expenses: Expense[]
	maintenances: Maintenance[]
}

export function calculateAnalyticsOverview({
	vehicle,
	allFuelLogs,
	allExpenses,
	allMaintenances,
	range
}: CalculateOverviewInput): AnalyticsOverview {
	const consumptionMap = calculateConsumption(allFuelLogs)

	const fuelLogs = allFuelLogs.filter((item) => isInDateRange(item.date, range))
	const expenses = allExpenses.filter((item) => isInDateRange(item.date, range))
	const maintenances = allMaintenances.filter((item) =>
		isInDateRange(item.date, range)
	)

	const seriesTotals: Record<CostSeriesKey, { amount: number; count: number }> =
		{
			fuel: { amount: 0, count: 0 },
			road: { amount: 0, count: 0 },
			taxes: { amount: 0, count: 0 },
			other: { amount: 0, count: 0 },
			maintenance: { amount: 0, count: 0 }
		}

	let totalFuelLiters = 0
	let totalFuelReimbursed = 0
	let closedDistanceKm = 0
	let closedPeriodLiters = 0
	let closedPeriodCost = 0

	for (const log of fuelLogs) {
		seriesTotals.fuel.amount += log.totalCost
		seriesTotals.fuel.count += 1
		totalFuelLiters += log.liters
		totalFuelReimbursed += log.reimbursedAmount

		const consumption = consumptionMap.get(log.id)

		if (consumption && consumption.distanceDrivenKm !== null) {
			closedDistanceKm += consumption.distanceDrivenKm
			closedPeriodLiters += consumption.periodLiters ?? 0
			closedPeriodCost += consumption.periodCost ?? 0
		}
	}

	const categoryTotals = new Map<
		ExpenseCategory,
		{ amount: number; count: number }
	>()

	for (const category of EXPENSE_CATEGORIES) {
		categoryTotals.set(category, { amount: 0, count: 0 })
	}

	for (const expense of expenses) {
		const series = EXPENSE_CATEGORY_SERIES[expense.category]
		seriesTotals[series].amount += expense.amount
		seriesTotals[series].count += 1

		const current = categoryTotals.get(expense.category)

		if (current) {
			current.amount += expense.amount
			current.count += 1
		}
	}

	const maintenanceBreakdown: MaintenanceCostBreakdown = {
		count: maintenances.length,
		totalAmount: 0,
		laborCost: 0,
		partsCost: 0,
		preventiveCost: 0,
		correctiveCost: 0,
		inspectionCost: 0
	}

	for (const maintenance of maintenances) {
		seriesTotals.maintenance.amount += maintenance.totalAmount
		seriesTotals.maintenance.count += 1

		maintenanceBreakdown.totalAmount += maintenance.totalAmount
		maintenanceBreakdown.laborCost += maintenance.laborCost
		maintenanceBreakdown.partsCost += maintenance.partsCost

		if (maintenance.type === 'PREVENTIVE') {
			maintenanceBreakdown.preventiveCost += maintenance.totalAmount
		} else if (maintenance.type === 'CORRECTIVE') {
			maintenanceBreakdown.correctiveCost += maintenance.totalAmount
		} else {
			maintenanceBreakdown.inspectionCost += maintenance.totalAmount
		}
	}

	maintenanceBreakdown.totalAmount = round(maintenanceBreakdown.totalAmount, 2)
	maintenanceBreakdown.laborCost = round(maintenanceBreakdown.laborCost, 2)
	maintenanceBreakdown.partsCost = round(maintenanceBreakdown.partsCost, 2)
	maintenanceBreakdown.preventiveCost = round(
		maintenanceBreakdown.preventiveCost,
		2
	)
	maintenanceBreakdown.correctiveCost = round(
		maintenanceBreakdown.correctiveCost,
		2
	)
	maintenanceBreakdown.inspectionCost = round(
		maintenanceBreakdown.inspectionCost,
		2
	)

	const totalCost = round(
		COST_SERIES_KEYS.reduce((sum, key) => sum + seriesTotals[key].amount, 0),
		2
	)

	const totalEntriesCount =
		fuelLogs.length + expenses.length + maintenances.length

	const activeMonths = new Set<string>()
	for (const log of fuelLogs) activeMonths.add(monthKeyUtc(log.date))
	for (const expense of expenses) activeMonths.add(monthKeyUtc(expense.date))
	for (const maintenance of maintenances)
		activeMonths.add(monthKeyUtc(maintenance.date))

	const activeMonthsCount = activeMonths.size
	const monthlyAverageCost =
		activeMonthsCount > 0 ? round(totalCost / activeMonthsCount, 2) : null

	const distanceDrivenKm = calculateDistanceDrivenKm({
		vehicle,
		allFuelLogs,
		allExpenses,
		allMaintenances,
		fuelLogs,
		expenses,
		maintenances,
		closedDistanceKm,
		range
	})

	const totalCostPerKm =
		distanceDrivenKm > 0 && totalCost > 0
			? round(totalCost / distanceDrivenKm, 4)
			: null

	const fuelCostPerKm =
		closedDistanceKm > 0 ? round(closedPeriodCost / closedDistanceKm, 4) : null

	const consumptionKmPerLiter =
		closedPeriodLiters > 0
			? round(closedDistanceKm / closedPeriodLiters, 2)
			: null

	const ethanolParity = computeEthanolParity(fuelLogs, consumptionMap)

	const bySeries: CostSeriesBreakdown[] = COST_SERIES_KEYS.map((series) => {
		const amount = round(seriesTotals[series].amount, 2)
		return {
			series,
			totalAmount: amount,
			count: seriesTotals[series].count,
			sharePercent: totalCost > 0 ? round((amount / totalCost) * 100, 1) : 0
		}
	})

	const byExpenseCategory: ExpenseCategoryBreakdown[] = EXPENSE_CATEGORIES.map(
		(category) => {
			const item = categoryTotals.get(category) ?? { amount: 0, count: 0 }
			const amount = round(item.amount, 2)
			return {
				category,
				series: EXPENSE_CATEGORY_SERIES[category],
				totalAmount: amount,
				count: item.count,
				sharePercent: totalCost > 0 ? round((amount / totalCost) * 100, 1) : 0
			}
		}
	).filter((item) => item.count > 0)

	return {
		vehicleId: vehicle.id,
		totalCost,
		totalFuelReimbursed: round(totalFuelReimbursed, 2),
		netTotalCost: round(Math.max(0, totalCost - totalFuelReimbursed), 2),
		totalEntriesCount,
		activeMonthsCount,
		monthlyAverageCost,
		distanceDrivenKm,
		totalCostPerKm,
		fuelCostPerKm,
		consumptionKmPerLiter,
		ethanolParity,
		totalFuelLiters: round(totalFuelLiters, 3),
		bySeries,
		byExpenseCategory,
		maintenanceBreakdown
	}
}

export function calculateMonthlyCosts({
	vehicleId,
	year,
	fuelLogs,
	expenses,
	maintenances
}: CalculateMonthlyCostsInput): MonthlyCostsSummary {
	const months: MonthlyCostItem[] = Array.from({ length: 12 }, (_, index) => ({
		month: index + 1,
		total: 0,
		count: 0,
		fuel: 0,
		road: 0,
		taxes: 0,
		other: 0,
		maintenance: 0
	}))

	for (const log of fuelLogs) {
		if (log.date.getUTCFullYear() !== year) continue
		const bucket = months[log.date.getUTCMonth()]
		bucket.fuel = round(bucket.fuel + log.totalCost, 2)
		bucket.total = round(bucket.total + log.totalCost, 2)
		bucket.count += 1
	}

	for (const expense of expenses) {
		if (expense.date.getUTCFullYear() !== year) continue
		const bucket = months[expense.date.getUTCMonth()]
		const series = EXPENSE_CATEGORY_SERIES[expense.category]
		bucket[series] = round(bucket[series] + expense.amount, 2)
		bucket.total = round(bucket.total + expense.amount, 2)
		bucket.count += 1
	}

	for (const maintenance of maintenances) {
		if (maintenance.date.getUTCFullYear() !== year) continue
		const bucket = months[maintenance.date.getUTCMonth()]
		bucket.maintenance = round(bucket.maintenance + maintenance.totalAmount, 2)
		bucket.total = round(bucket.total + maintenance.totalAmount, 2)
		bucket.count += 1
	}

	const yearTotal = round(
		months.reduce((sum, item) => sum + item.total, 0),
		2
	)
	const activeCount = months.filter((item) => item.count > 0).length
	const monthlyAverage =
		activeCount > 0 ? round(yearTotal / activeCount, 2) : null

	return {
		vehicleId,
		year,
		yearTotal,
		monthlyAverage,
		months
	}
}

function monthKeyUtc(date: Date): string {
	return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}`
}

interface DistanceParams {
	vehicle: Vehicle
	allFuelLogs: FuelLog[]
	allExpenses: Expense[]
	allMaintenances: Maintenance[]
	fuelLogs: FuelLog[]
	expenses: Expense[]
	maintenances: Maintenance[]
	closedDistanceKm: number
	range: DateRange
}

function calculateDistanceDrivenKm({
	vehicle,
	allFuelLogs,
	allExpenses,
	allMaintenances,
	fuelLogs,
	expenses,
	maintenances,
	closedDistanceKm,
	range
}: DistanceParams): number {
	const isUnfiltered = !range.gte && !range.lt

	if (isUnfiltered) {
		const vehicleSpan = Math.max(
			0,
			vehicle.currentOdometerKm - vehicle.initialOdometerKm
		)
		return Math.max(vehicleSpan, closedDistanceKm)
	}

	const periodOdometers = collectOdometers(fuelLogs, expenses, maintenances)

	if (periodOdometers.length === 0) {
		return 0
	}

	const maxInPeriod = Math.max(...periodOdometers)
	const minInPeriod = Math.min(...periodOdometers)

	// Se houver registros anteriores ao início do período, o maior odômetro anterior
	// serve como ponto de partida real do período; senão usa o menor do período
	let baselineKm = minInPeriod

	if (range.gte) {
		const priorOdometers = collectPriorOdometers(
			allFuelLogs,
			allExpenses,
			allMaintenances,
			range.gte
		)

		if (priorOdometers.length > 0) {
			baselineKm = Math.min(minInPeriod, Math.max(...priorOdometers))
		} else {
			baselineKm = Math.min(minInPeriod, vehicle.initialOdometerKm)
		}
	}

	const odometerSpan = Math.max(0, maxInPeriod - baselineKm)

	return Math.max(odometerSpan, closedDistanceKm)
}

function collectOdometers(
	fuelLogs: FuelLog[],
	expenses: Expense[],
	maintenances: Maintenance[]
): number[] {
	const values: number[] = []

	for (const log of fuelLogs) {
		values.push(log.odometerKm)
	}

	for (const expense of expenses) {
		if (expense.odometerKm !== null) {
			values.push(expense.odometerKm)
		}
	}

	for (const maintenance of maintenances) {
		values.push(maintenance.odometerKm)
	}

	return values
}

function collectPriorOdometers(
	allFuelLogs: FuelLog[],
	allExpenses: Expense[],
	allMaintenances: Maintenance[],
	before: Date
): number[] {
	return collectOdometers(
		allFuelLogs.filter((item) => item.date < before),
		allExpenses.filter((item) => item.date < before),
		allMaintenances.filter((item) => item.date < before)
	)
}

function computeEthanolParity(
	fuelLogs: FuelLog[],
	consumptionMap: Map<string, ConsumptionResult>
): number | null {
	const ethanolKmPerL = averageKmPerLiterForTypes(
		fuelLogs.filter((item) => item.fuelType === 'ETHANOL'),
		consumptionMap
	)
	const gasolineKmPerL = averageKmPerLiterForTypes(
		fuelLogs.filter((item) => GASOLINE_TYPES.includes(item.fuelType)),
		consumptionMap
	)

	return ethanolKmPerL && gasolineKmPerL
		? round(ethanolKmPerL / gasolineKmPerL, 3)
		: null
}

function averageKmPerLiterForTypes(
	logs: FuelLog[],
	consumptionMap: Map<string, ConsumptionResult>
): number | null {
	let distanceKm = 0
	let liters = 0

	for (const log of logs) {
		const result = consumptionMap.get(log.id)
		if (result && result.distanceDrivenKm !== null) {
			distanceKm += result.distanceDrivenKm
			liters += result.periodLiters ?? 0
		}
	}

	return liters > 0 ? round(distanceKm / liters, 2) : null
}

