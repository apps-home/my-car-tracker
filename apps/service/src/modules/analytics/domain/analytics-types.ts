import type { ExpenseCategory } from '@/modules/expenses/domain/expense-category'

export const COST_SERIES_KEYS = [
	'fuel',
	'road',
	'taxes',
	'other',
	'maintenance'
] as const

export type CostSeriesKey = (typeof COST_SERIES_KEYS)[number]

export const EXPENSE_CATEGORY_SERIES: Record<ExpenseCategory, CostSeriesKey> = {
	TOLL: 'road',
	PARKING: 'road',
	IPVA: 'taxes',
	LICENSING: 'taxes',
	INSURANCE: 'taxes',
	CAR_WASH: 'other',
	FINE: 'other',
	ACCESSORY: 'other',
	OTHER: 'other'
}

export interface CostSeriesBreakdown {
	series: CostSeriesKey
	totalAmount: number
	count: number
	/** Percentual sobre o TCO (0 a 100, 1 casa decimal) */
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
	/** Custo total de propriedade (TCO) no período */
	totalCost: number
	/** Total de ajudas/reembolsos de combustível recebidos no período */
	totalFuelReimbursed: number
	/** Custo total líquido ("do seu bolso": `totalCost - totalFuelReimbursed`) */
	netTotalCost: number
	/** Quantidade total de registros (abastecimentos + despesas + manutenções) */
	totalEntriesCount: number
	/** Quantidade de meses com pelo menos 1 lançamento no período */
	activeMonthsCount: number
	/** Média mensal nos meses com lançamento */
	monthlyAverageCost: number | null
	/** Quilometragem percorrida considerada no período */
	distanceDrivenKm: number
	/** Custo total por km rodado (TCO ÷ distanceDrivenKm) */
	totalCostPerKm: number | null
	/** Custo apenas de combustível por km (nos períodos fechados por tanque cheio) */
	fuelCostPerKm: number | null
	/** Consumo médio (km/L) nos períodos fechados por tanque cheio */
	consumptionKmPerLiter: number | null
	/** Paridade real etanol/gasolina do veículo no período */
	ethanolParity: number | null
	/** Total de litros abastecidos no período */
	totalFuelLiters: number
	/** Distribuição nas 5 séries principais */
	bySeries: CostSeriesBreakdown[]
	/** Distribuição detalhada das despesas operacionais por categoria */
	byExpenseCategory: ExpenseCategoryBreakdown[]
	/** Detalhamento dos custos de oficina (peças vs. mão de obra e por tipo) */
	maintenanceBreakdown: MaintenanceCostBreakdown
}

export interface MonthlyCostItem {
	/** Mês de 1 a 12 */
	month: number
	total: number
	count: number
	fuel: number
	road: number
	taxes: number
	other: number
	maintenance: number
}

export interface MonthlyCostsSummary {
	vehicleId: string
	year: number
	yearTotal: number
	monthlyAverage: number | null
	months: MonthlyCostItem[]
}

