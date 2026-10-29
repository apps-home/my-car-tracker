import { Injectable } from '@nestjs/common'

import { Either, left, right } from '@/core/utils/Either'

import { ExpenseHTTP, ExpenseMapper } from '../../domain/expense.mapper'
import { ExpenseRepository } from '../../domain/expense.repository'
import { ExpenseNotFoundError } from '../errors/expense-not-found.error'

type Response = Either<ExpenseNotFoundError, ExpenseHTTP>

@Injectable()
export class FindExpenseByIdUseCase {
  constructor(private expenseRepository: ExpenseRepository) {}

  async execute(userId: string, id: string): Promise<Response> {
    const expense = await this.expenseRepository.findById(id, userId)

    if (!expense) {
      return left(new ExpenseNotFoundError())
    }

    return right(ExpenseMapper.toHTTP(expense))
  }
}
