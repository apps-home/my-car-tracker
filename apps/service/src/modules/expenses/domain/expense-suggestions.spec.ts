import { faker } from '@faker-js/faker'
import { makeExpense } from '@test/factories/make-expense'
import { describe, expect, it } from 'vitest'

import { buildExpenseSuggestions } from './expense-suggestions'

describe('buildExpenseSuggestions', () => {
  it('should group repeated expenses and order by frequency', () => {
    const toll = {
      category: 'TOLL' as const,
      description: 'Pedágio Anhanguera',
      amount: 12.4
    }
    const parking = {
      category: 'PARKING' as const,
      description: 'Shopping',
      amount: 15
    }

    const suggestions = buildExpenseSuggestions(
      [
        makeExpense({ ...parking, date: new Date('2026-03-01') }),
        makeExpense({ ...toll, date: new Date('2026-03-02') }),
        makeExpense({
          ...toll,
          description: 'pedágio anhanguera',
          date: new Date('2026-03-01')
        }),
        makeExpense({
          ...toll,
          date: new Date('2026-03-05'),
          locationOrRoute: 'SP-330',
          paymentMethod: 'TAG'
        })
      ],
      5
    )

    expect(suggestions).toHaveLength(2)
    expect(suggestions[0]).toMatchObject({
      category: 'TOLL',
      description: 'Pedágio Anhanguera',
      amount: 12.4,
      count: 3,
      locationOrRoute: 'SP-330',
      paymentMethod: 'TAG',
      lastDate: new Date('2026-03-05')
    })
    expect(suggestions[1]).toMatchObject({ category: 'PARKING', count: 1 })
  })

  it('should keep different amounts apart and respect the limit', () => {
    const description = faker.commerce.productName()

    const suggestions = buildExpenseSuggestions(
      [
        makeExpense({ category: 'TOLL', description, amount: 10 }),
        makeExpense({ category: 'TOLL', description, amount: 11 }),
        makeExpense({ category: 'TOLL', description, amount: 12 })
      ],
      2
    )

    expect(suggestions).toHaveLength(2)
    expect(suggestions.every(({ count }) => count === 1)).toBe(true)
  })
})
