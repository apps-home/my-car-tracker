import type { PeriodParams } from '@/features/fuel-logs/api/types'
import type {
  CreateResponse,
  MutationResponse
} from '@/features/vehicles/api/types'
import type { PaymentMethod } from '@/shared/utils/payment-methods'

export type { CreateResponse, MutationResponse }

export const EXPENSE_CATEGORIES = [
  'TOLL',
  'PARKING',
  'IPVA',
  'LICENSING',
  'INSURANCE',
  'CAR_WASH',
  'FINE',
  'ACCESSORY',
  'OTHER'
] as const

export type ExpenseCategory = (typeof EXPENSE_CATEGORIES)[number]

export interface Expense {
  id: string
  vehicleId: string
  category: ExpenseCategory
  /** Dia da despesa (00:00 UTC) */
  date: string
  amount: number
  description: string
  locationOrRoute: string | null
  odometerKm: number | null
  paymentMethod: PaymentMethod | null
  receiptUrl: string | null
  notes: string | null
  createdAt: string
  updatedAt: string
}

export interface CreateExpenseDTO {
  vehicleId: string
  category: ExpenseCategory
  /** YYYY-MM-DD */
  date: string
  amount: number
  description: string
  locationOrRoute?: string | null
  odometerKm?: number | null
  paymentMethod?: PaymentMethod | null
  notes?: string | null
}

export type UpdateExpenseDTO = Partial<Omit<CreateExpenseDTO, 'vehicleId'>>

export interface ListExpensesParams extends PeriodParams {
  vehicleId?: string
  category?: ExpenseCategory
  search?: string
}

export interface ExpenseSuggestionsParams {
  vehicleId: string
  category?: ExpenseCategory
}

export interface ExpenseSuggestion {
  category: ExpenseCategory
  description: string
  amount: number
  locationOrRoute: string | null
  paymentMethod: PaymentMethod | null
  count: number
  lastDate: string
}
