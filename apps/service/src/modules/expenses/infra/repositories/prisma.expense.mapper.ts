import type { Prisma } from '@lib/my-car-tracker-db'

import { Expense } from '../../domain/expense.entity'

export class PrismaExpenseMapper {
  static toDomain(raw: Prisma.VehicleExpenseGetPayload<{}>): Expense {
    return new Expense({
      id: raw.id,
      vehicleId: raw.vehicleId,
      userId: raw.userId,
      category: raw.category,
      date: raw.date,
      amount: raw.amount.toNumber(),
      description: raw.description,
      locationOrRoute: raw.locationOrRoute,
      odometerKm: raw.odometerKm,
      paymentMethod: raw.paymentMethod,
      receiptUrl: raw.receiptUrl,
      notes: raw.notes,
      createdAt: raw.createdAt,
      updatedAt: raw.updatedAt
    })
  }

  static toPrisma(expense: Expense): Prisma.VehicleExpenseUncheckedCreateInput {
    return {
      id: expense.id,
      vehicleId: expense.vehicleId,
      userId: expense.userId,
      category: expense.category,
      date: expense.date,
      amount: expense.amount,
      description: expense.description,
      locationOrRoute: expense.locationOrRoute,
      odometerKm: expense.odometerKm,
      paymentMethod: expense.paymentMethod,
      receiptUrl: expense.receiptUrl,
      notes: expense.notes,
      createdAt: expense.createdAt,
      updatedAt: expense.updatedAt
    }
  }
}
