import type { PaymentMethod } from '@/core/domain/payment-method'

import type { Expense } from './expense.entity'
import type { ExpenseCategory } from './expense-category'

export interface ExpenseSuggestion {
  category: ExpenseCategory
  description: string
  amount: number
  locationOrRoute: string | null
  paymentMethod: PaymentMethod | null
  count: number
  lastDate: Date
}

/**
 * Lançamentos que se repetem (mesma categoria, descrição e valor), dos mais
 * frequentes para os menos; no empate, o mais recente primeiro.
 * Local e forma de pagamento vêm da ocorrência mais recente.
 */
export function buildExpenseSuggestions(
  expenses: Expense[],
  limit: number
): ExpenseSuggestion[] {
  const groups = new Map<string, ExpenseSuggestion>()

  for (const expense of expenses) {
    const key = [
      expense.category,
      expense.description.toLowerCase(),
      expense.amount.toFixed(2)
    ].join('|')
    const current = groups.get(key)

    if (!current) {
      groups.set(key, {
        category: expense.category,
        description: expense.description,
        amount: expense.amount,
        locationOrRoute: expense.locationOrRoute,
        paymentMethod: expense.paymentMethod,
        count: 1,
        lastDate: expense.date
      })
      continue
    }

    current.count += 1

    if (expense.date > current.lastDate) {
      current.description = expense.description
      current.locationOrRoute = expense.locationOrRoute
      current.paymentMethod = expense.paymentMethod
      current.lastDate = expense.date
    }
  }

  return [...groups.values()]
    .sort(
      (a, b) => b.count - a.count || b.lastDate.getTime() - a.lastDate.getTime()
    )
    .slice(0, limit)
}
