import { faker } from '@faker-js/faker'
import { makeExpense, makeExpensePayload } from '@test/factories/make-expense'
import { describe, expect, it } from 'vitest'

import { PayloadError } from '@/core/domain/errors/payload-error'
import { addDaysUtc, startOfDayUtc } from '@/core/utils/utc-date'

import { Expense } from './expense.entity'

describe('Expense entity', () => {
  const userId = faker.string.alphanumeric(32)

  describe('create()', () => {
    it('should normalize the values and apply the defaults', () => {
      const expense = Expense.create(
        userId,
        makeExpensePayload({
          date: new Date('2026-03-10T21:30:00Z'),
          amount: 12.345,
          description: '  Pedágio Bandeirantes  ',
          locationOrRoute: '  ',
          paymentMethod: undefined
        })
      )

      expect(expense.userId).toBe(userId)
      expect(expense.date).toEqual(new Date('2026-03-10T00:00:00Z'))
      expect(expense.amount).toBe(12.35)
      expect(expense.description).toBe('Pedágio Bandeirantes')
      expect(expense.locationOrRoute).toBeNull()
      expect(expense.paymentMethod).toBeNull()
      expect(expense.odometerKm).toBeNull()
      expect(expense.receiptUrl).toBeNull()
    })

    it.each([
      ['an empty description', { description: '   ' }],
      ['a zero amount', { amount: 0 }],
      ['a negative odometer', { odometerKm: -1 }],
      ['a future date', { date: addDaysUtc(startOfDayUtc(new Date()), 3) }]
    ])('should reject %s', (_, override) => {
      expect(() =>
        Expense.create(userId, makeExpensePayload(override))
      ).toThrow(PayloadError)
    })
  })

  describe('update()', () => {
    it('should ignore undefined fields and keep the identity', () => {
      const expense = makeExpense()
      const { id, vehicleId, userId: owner, createdAt, amount } = expense

      expense.update({ amount: undefined, notes: 'Ida e volta' })

      expect(expense.id).toBe(id)
      expect(expense.vehicleId).toBe(vehicleId)
      expect(expense.userId).toBe(owner)
      expect(expense.createdAt).toBe(createdAt)
      expect(expense.amount).toBe(amount)
      expect(expense.notes).toBe('Ida e volta')
    })

    it('should clear nullable fields with null', () => {
      const expense = makeExpense({ odometerKm: 1000, paymentMethod: 'TAG' })

      expense.update({ odometerKm: null, paymentMethod: null })

      expect(expense.odometerKm).toBeNull()
      expect(expense.paymentMethod).toBeNull()
    })

    it('should throw PayloadError and keep the previous state', () => {
      const expense = makeExpense()
      const description = expense.description

      expect(() => expense.update({ description: '' })).toThrow(PayloadError)
      expect(expense.description).toBe(description)
    })
  })
})
