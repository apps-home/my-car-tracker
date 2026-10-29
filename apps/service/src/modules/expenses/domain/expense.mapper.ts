import type { Expense, ExpenseProps } from './expense.entity'

export type ExpenseHTTP = Omit<ExpenseProps, 'userId'>

export class ExpenseMapper {
  static toHTTP(expense: Expense): ExpenseHTTP {
    return {
      id: expense.id,
      vehicleId: expense.vehicleId,
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
