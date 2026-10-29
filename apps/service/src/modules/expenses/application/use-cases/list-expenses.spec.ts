import { faker } from '@faker-js/faker'
import { makeExpense } from '@test/factories/make-expense'
import { InMemoryExpenseRepository } from '@test/repositories/in-memory-expense.repository'
import { beforeEach, describe, expect, it } from 'vitest'

import { ListExpensesUseCase } from './list-expenses'

describe('ListExpensesUseCase', () => {
  let expenseRepository: InMemoryExpenseRepository
  let sut: ListExpensesUseCase
  const userId = faker.string.alphanumeric(32)

  beforeEach(() => {
    expenseRepository = new InMemoryExpenseRepository()
    sut = new ListExpensesUseCase(expenseRepository)

    expenseRepository.items.push(
      makeExpense({
        userId,
        category: 'TOLL',
        description: 'Pedágio Bandeirantes',
        date: new Date('2026-03-02')
      }),
      makeExpense({
        userId,
        category: 'IPVA',
        description: 'IPVA 1ª parcela',
        date: new Date('2026-01-15')
      }),
      makeExpense({
        userId,
        category: 'PARKING',
        description: 'Estacionamento',
        locationOrRoute: 'Shopping Iguatemi',
        date: new Date('2026-03-05')
      }),
      makeExpense({ category: 'TOLL', date: new Date('2026-03-03') })
    )
  })

  it('should list only the expenses of the user, newest first', async () => {
    const result = await sut.execute({ userId })

    expect(result.value.map(({ category }) => category)).toEqual([
      'PARKING',
      'TOLL',
      'IPVA'
    ])
  })

  it('should filter by category, period and search', async () => {
    expect(
      (await sut.execute({ userId, category: 'TOLL' })).value
    ).toHaveLength(1)
    expect(
      (await sut.execute({ userId, year: 2026, month: 1 })).value
    ).toHaveLength(1)
    expect(
      (await sut.execute({ userId, search: 'iguatemi' })).value
    ).toHaveLength(1)
    expect(
      (await sut.execute({ userId, search: 'PEDÁGIO' })).value
    ).toHaveLength(1)
  })
})
