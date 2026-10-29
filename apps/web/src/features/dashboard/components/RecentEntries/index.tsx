import {
  Card,
  CardContent,
  CardHeader,
  CardTitle
} from '@lib/ui/components/card'
import { Fuel } from 'lucide-react'

import type { Expense } from '@/features/expenses/api/types'
import {
  EXPENSE_CATEGORY_ICONS,
  EXPENSE_CATEGORY_LABELS
} from '@/features/expenses/utils/category-labels'
import type { FuelLog } from '@/features/fuel-logs/api/types'
import { FUEL_TYPE_LABELS } from '@/features/vehicles/utils/fuel-type-labels'
import { formatCurrency } from '@/shared/utils/format-currency'
import { formatDate } from '@/shared/utils/format-date'

interface RecentEntriesProps {
  fuelLogs: FuelLog[]
  expenses: Expense[]
  limit?: number
}

interface Entry {
  id: string
  date: string
  createdAt: string
  title: string
  subtitle: string
  amount: number
  icon: typeof Fuel
}

export function RecentEntries({
  fuelLogs,
  expenses,
  limit = 6
}: RecentEntriesProps) {
  const entries: Entry[] = [
    ...fuelLogs.map((fuelLog) => ({
      id: fuelLog.id,
      date: fuelLog.date,
      createdAt: fuelLog.createdAt,
      title: FUEL_TYPE_LABELS[fuelLog.fuelType],
      subtitle: fuelLog.gasStationName ?? 'Abastecimento',
      amount: fuelLog.totalCost,
      icon: Fuel
    })),
    ...expenses.map((expense) => ({
      id: expense.id,
      date: expense.date,
      createdAt: expense.createdAt,
      title: expense.description,
      subtitle: EXPENSE_CATEGORY_LABELS[expense.category],
      amount: expense.amount,
      icon: EXPENSE_CATEGORY_ICONS[expense.category]
    }))
  ]
    .sort(
      (a, b) =>
        b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt)
    )
    .slice(0, limit)

  return (
    <Card data-slot="recent-entries">
      <CardHeader>
        <CardTitle>Últimos lançamentos</CardTitle>
      </CardHeader>
      <CardContent>
        {entries.length === 0 ? (
          <p className="text-muted-foreground text-xs">
            Nada lançado ainda. Use o botão + para registrar.
          </p>
        ) : (
          <ul className="divide-y">
            {entries.map((entry) => (
              <li key={entry.id} className="flex items-center gap-3 py-2">
                <entry.icon className="size-4 shrink-0 text-muted-foreground" />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-xs">{entry.title}</p>
                  <p className="truncate text-[11px] text-muted-foreground">
                    {formatDate(entry.date)} · {entry.subtitle}
                  </p>
                </div>
                <span className="font-medium text-xs tabular-nums">
                  {formatCurrency(entry.amount)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}
