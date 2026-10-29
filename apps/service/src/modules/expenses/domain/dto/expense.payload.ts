import type { PaymentMethod } from '@/core/domain/payment-method'
import type { PeriodFilter } from '@/core/utils/date-range'

import type { ExpenseCategory } from '../expense-category'

export interface CreateExpensePayload {
  vehicleId: string
  category: ExpenseCategory
  date: Date
  amount: number
  description: string
  locationOrRoute?: string | null
  odometerKm?: number | null
  paymentMethod?: PaymentMethod | null
  notes?: string | null
}

export type UpdateExpensePayload = Partial<
  Omit<CreateExpensePayload, 'vehicleId'>
>

export interface ListExpensesParams extends PeriodFilter {
  userId: string
  vehicleId?: string
  category?: ExpenseCategory
  /** Busca na descrição e no local/rota, sem diferenciar maiúsculas */
  search?: string
}

export interface ExpenseSuggestionsParams {
  userId: string
  vehicleId: string
  category?: ExpenseCategory
}
