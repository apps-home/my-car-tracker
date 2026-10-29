import { isInDateRange, toDateRange } from '@/core/utils/date-range'
import type { ListExpensesParams } from '@/modules/expenses/domain/dto/expense.payload'
import { Expense } from '@/modules/expenses/domain/expense.entity'
import { ExpenseMapper } from '@/modules/expenses/domain/expense.mapper'
import type { ExpenseRepository } from '@/modules/expenses/domain/expense.repository'

/** Devolve cópias, como o banco: alterar uma entidade sem `save` não muda `items` */
function clone(expense: Expense): Expense {
  return new Expense({
    ...ExpenseMapper.toHTTP(expense),
    userId: expense.userId
  })
}

export class InMemoryExpenseRepository implements ExpenseRepository {
  public items: Expense[] = []

  async findById(id: string, userId: string): Promise<Expense | null> {
    const expense = this.items.find(
      (item) => item.id === id && item.userId === userId
    )
    return expense ? clone(expense) : null
  }

  async list({
    userId,
    vehicleId,
    category,
    search,
    ...period
  }: ListExpensesParams): Promise<Expense[]> {
    const range = toDateRange(period)
    const term = search?.trim().toLowerCase()

    return this.items
      .filter((item) => item.userId === userId)
      .filter((item) => !vehicleId || item.vehicleId === vehicleId)
      .filter((item) => !category || item.category === category)
      .filter((item) => isInDateRange(item.date, range))
      .filter(
        (item) =>
          !term ||
          item.description.toLowerCase().includes(term) ||
          !!item.locationOrRoute?.toLowerCase().includes(term)
      )
      .sort(
        (a, b) =>
          b.date.getTime() - a.date.getTime() ||
          b.createdAt.getTime() - a.createdAt.getTime()
      )
      .map(clone)
  }

  async create(expense: Expense): Promise<void> {
    this.items.push(clone(expense))
  }

  async save(expense: Expense): Promise<void> {
    const index = this.items.findIndex((item) => item.id === expense.id)
    this.items[index] = clone(expense)
  }

  async delete(expense: Expense): Promise<void> {
    this.items = this.items.filter((item) => item.id !== expense.id)
  }
}
