import { Injectable } from '@nestjs/common'

import { Either, right } from '@/core/utils/Either'

import type { ListExpensesParams } from '../../domain/dto/expense.payload'
import { ExpenseHTTP, ExpenseMapper } from '../../domain/expense.mapper'
import { ExpenseRepository } from '../../domain/expense.repository'

type Response = Either<never, ExpenseHTTP[]>

@Injectable()
export class ListExpensesUseCase {
  constructor(private expenseRepository: ExpenseRepository) {}

  async execute(params: ListExpensesParams): Promise<Response> {
    const expenses = await this.expenseRepository.list(params)

    return right(expenses.map(ExpenseMapper.toHTTP))
  }
}
