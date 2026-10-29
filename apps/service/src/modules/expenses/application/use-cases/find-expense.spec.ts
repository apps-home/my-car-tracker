import { faker } from '@faker-js/faker'
import { makeExpense } from '@test/factories/make-expense'
import { InMemoryExpenseRepository } from '@test/repositories/in-memory-expense.repository'
import { beforeEach, describe, expect, it } from 'vitest'

import { ExpenseNotFoundError } from '../errors/expense-not-found.error'
import { FindExpenseByIdUseCase } from './find-expense'

describe('FindExpenseByIdUseCase', () => {
  let expenseRepository: InMemoryExpenseRepository
  let sut: FindExpenseByIdUseCase

  beforeEach(() => {
    expenseRepository = new InMemoryExpenseRepository()
    sut = new FindExpenseByIdUseCase(expenseRepository)
  })

  it('should find an expense of the user', async () => {
    const expense = makeExpense()
    expenseRepository.items.push(expense)

    const result = await sut.execute(expense.userId, expense.id)

    expect(result.isRight()).toBe(true)
    if (result.isRight()) {
      expect(result.value.id).toBe(expense.id)
      expect(result.value).not.toHaveProperty('userId')
    }
  })

  it('should not find the expense of another user', async () => {
    const expense = makeExpense()
    expenseRepository.items.push(expense)

    const result = await sut.execute(faker.string.alphanumeric(32), expense.id)

    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(ExpenseNotFoundError)
  })
})
