import type { ListExpensesParams } from './dto/expense.payload'
import type { Expense } from './expense.entity'

export abstract class ExpenseRepository {
  abstract findById(id: string, userId: string): Promise<Expense | null>
  /** Ordenado por data, da mais recente para a mais antiga */
  abstract list(params: ListExpensesParams): Promise<Expense[]>
  abstract create(expense: Expense): Promise<void>
  abstract save(expense: Expense): Promise<void>
  abstract delete(expense: Expense): Promise<void>
}
