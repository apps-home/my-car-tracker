import { Injectable } from '@nestjs/common'

import { Either, left, right } from '@/core/utils/Either'

import { ExpenseRepository } from '../../domain/expense.repository'
import { ExpenseNotFoundError } from '../errors/expense-not-found.error'

type Response = Either<ExpenseNotFoundError, void>

@Injectable()
export class DeleteExpenseUseCase {
  constructor(private expenseRepository: ExpenseRepository) {}

  async execute(userId: string, id: string): Promise<Response> {
    const expense = await this.expenseRepository.findById(id, userId)

    if (!expense) {
      return left(new ExpenseNotFoundError())
    }

    await this.expenseRepository.delete(expense)

    return right(void 0)
  }
}
