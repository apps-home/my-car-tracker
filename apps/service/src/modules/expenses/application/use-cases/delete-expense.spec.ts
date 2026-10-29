import { faker } from '@faker-js/faker'
import { makeExpense } from '@test/factories/make-expense'
import { InMemoryExpenseRepository } from '@test/repositories/in-memory-expense.repository'
import { beforeEach, describe, expect, it } from 'vitest'

import { ExpenseNotFoundError } from '../errors/expense-not-found.error'
import { DeleteExpenseUseCase } from './delete-expense'

describe('DeleteExpenseUseCase', () => {
  let expenseRepository: InMemoryExpenseRepository
  let sut: DeleteExpenseUseCase

  beforeEach(() => {
    expenseRepository = new InMemoryExpenseRepository()
    sut = new DeleteExpenseUseCase(expenseRepository)
  })

  it('should delete an expense of the user', async () => {
    const expense = makeExpense()
    expenseRepository.items.push(expense)

    const result = await sut.execute(expense.userId, expense.id)

    expect(result.isRight()).toBe(true)
    expect(expenseRepository.items).toHaveLength(0)
  })

  it('should not delete the expense of another user', async () => {
    const expense = makeExpense()
    expenseRepository.items.push(expense)

    const result = await sut.execute(faker.string.alphanumeric(32), expense.id)

    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(ExpenseNotFoundError)
    expect(expenseRepository.items).toHaveLength(1)
  })
})
