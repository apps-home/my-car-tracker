import { faker } from '@faker-js/faker'

import { PAYMENT_METHODS } from '@/core/domain/payment-method'
import { startOfDayUtc } from '@/core/utils/utc-date'
import type { CreateExpensePayload } from '@/modules/expenses/domain/dto/expense.payload'
import {
  Expense,
  type ExpenseProps
} from '@/modules/expenses/domain/expense.entity'
import { EXPENSE_CATEGORIES } from '@/modules/expenses/domain/expense-category'

export function makeExpensePayload(
  override: Partial<CreateExpensePayload> = {}
): CreateExpensePayload {
  return {
    vehicleId: faker.string.uuid(),
    category: faker.helpers.arrayElement(EXPENSE_CATEGORIES),
    date: startOfDayUtc(faker.date.recent({ days: 30 })),
    amount: faker.number.float({ min: 5, max: 500, fractionDigits: 2 }),
    description: faker.commerce.productName(),
    locationOrRoute: faker.location.street(),
    paymentMethod: faker.helpers.arrayElement(PAYMENT_METHODS),
    ...override
  }
}

export function makeExpense(override: Partial<ExpenseProps> = {}): Expense {
  return new Expense({
    id: faker.string.uuid(),
    vehicleId: faker.string.uuid(),
    userId: faker.string.alphanumeric(32),
    category: faker.helpers.arrayElement(EXPENSE_CATEGORIES),
    date: startOfDayUtc(faker.date.recent({ days: 30 })),
    amount: faker.number.float({ min: 5, max: 500, fractionDigits: 2 }),
    description: faker.commerce.productName(),
    locationOrRoute: null,
    odometerKm: null,
    paymentMethod: null,
    receiptUrl: null,
    notes: null,
    createdAt: faker.date.past(),
    updatedAt: faker.date.recent(),
    ...override
  })
}
