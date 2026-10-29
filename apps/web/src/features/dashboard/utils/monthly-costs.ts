import type { Expense, ExpenseCategory } from '@/features/expenses/api/types'
import type { FuelLog } from '@/features/fuel-logs/api/types'
import type { Maintenance } from '@/features/maintenances/api/types'
import { MONTH_NAMES } from '@/shared/utils/month-names'

import type { MonthlyCostBucket } from '../api/types'

export const COST_SERIES = [
  { key: 'fuel', label: 'Combustível', color: 'var(--series-1)' },
  { key: 'road', label: 'Pedágio e estacionamento', color: 'var(--series-2)' },
  { key: 'taxes', label: 'Impostos e seguro', color: 'var(--series-3)' },
  { key: 'other', label: 'Outras', color: 'var(--series-4)' },
  { key: 'maintenance', label: 'Manutenção', color: 'var(--series-5)' }
] as const

export type CostSeriesKey = (typeof COST_SERIES)[number]['key']

const CATEGORY_SERIES: Record<ExpenseCategory, CostSeriesKey> = {
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

export type MonthlyCost = { month: string; total: number } & Record<
  CostSeriesKey,
  number
>

/** Mês (0-11) de uma data de calendário, que chega como 00:00 UTC */
function monthOf(date: string) {
  return new Date(date).getUTCMonth()
}

/** Converte os buckets mensais do endpoint `/analytics/monthly-costs` para o formato do gráfico */
export function toMonthlyCostSeries(
  buckets: MonthlyCostBucket[]
): MonthlyCost[] {
  return MONTH_NAMES.map((name, index) => {
    const bucket = buckets[index]
    return {
      month: name.slice(0, 3),
      total: bucket?.total ?? 0,
      fuel: bucket?.fuel ?? 0,
      road: bucket?.road ?? 0,
      taxes: bucket?.taxes ?? 0,
      other: bucket?.other ?? 0,
      maintenance: bucket?.maintenance ?? 0
    }
  })
}

/** Custos de cada mês do ano por série, com as datas já filtradas pelo ano */
export function buildMonthlyCosts(
  fuelLogs: FuelLog[],
  expenses: Expense[],
  maintenances: Maintenance[] = []
): MonthlyCost[] {
  const months: MonthlyCost[] = MONTH_NAMES.map((name) => ({
    month: name.slice(0, 3),
    total: 0,
    fuel: 0,
    road: 0,
    taxes: 0,
    other: 0,
    maintenance: 0
  }))

  for (const fuelLog of fuelLogs) {
    const month = months[monthOf(fuelLog.date)]
    month.fuel += fuelLog.totalCost
    month.total += fuelLog.totalCost
  }

  for (const expense of expenses) {
    const month = months[monthOf(expense.date)]
    month[CATEGORY_SERIES[expense.category]] += expense.amount
    month.total += expense.amount
  }

  for (const maintenance of maintenances) {
    const month = months[monthOf(maintenance.date)]
    month.maintenance += maintenance.totalAmount
    month.total += maintenance.totalAmount
  }

  return months
}
