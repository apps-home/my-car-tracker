import { NotFoundError } from '@/core/domain/errors/not-found-error'

export class ExpenseNotFoundError extends NotFoundError {
  constructor(message?: string) {
    super(message || 'Expense not found.')
    this.name = ExpenseNotFoundError.name
  }
}
