import type { MyCarTracker } from '@lib/my-car-tracker-db'
import { Inject, Injectable } from '@nestjs/common'

import { toDateRange } from '@/core/utils/date-range'

import type { ListExpensesParams } from '../../domain/dto/expense.payload'
import { Expense } from '../../domain/expense.entity'
import { ExpenseRepository } from '../../domain/expense.repository'
import { PrismaExpenseMapper } from './prisma.expense.mapper'

@Injectable()
export class PrismaExpenseRepository implements ExpenseRepository {
  constructor(@Inject('prismaMyCarTracker') private prisma: MyCarTracker) {}

  async findById(id: string, userId: string): Promise<Expense | null> {
    const expense = await this.prisma.vehicleExpense.findFirst({
      where: { id, userId }
    })

    if (!expense) {
      return null
    }

    return PrismaExpenseMapper.toDomain(expense)
  }

  async list({
    userId,
    vehicleId,
    category,
    search,
    ...period
  }: ListExpensesParams): Promise<Expense[]> {
    const term = search?.trim()

    const expenses = await this.prisma.vehicleExpense.findMany({
      where: {
        userId,
        vehicleId,
        category,
        date: toDateRange(period),
        ...(term && {
          OR: [
            { description: { contains: term, mode: 'insensitive' } },
            { locationOrRoute: { contains: term, mode: 'insensitive' } }
          ]
        })
      },
      orderBy: [{ date: 'desc' }, { createdAt: 'desc' }]
    })

    return expenses.map(PrismaExpenseMapper.toDomain)
  }

  async create(expense: Expense): Promise<void> {
    await this.prisma.vehicleExpense.create({
      data: PrismaExpenseMapper.toPrisma(expense)
    })
  }

  async save(expense: Expense): Promise<void> {
    const { id, vehicleId, userId, createdAt, ...data } =
      PrismaExpenseMapper.toPrisma(expense)

    await this.prisma.vehicleExpense.update({
      where: { id, userId },
      data
    })
  }

  async delete(expense: Expense): Promise<void> {
    await this.prisma.vehicleExpense.delete({
      where: { id: expense.id, userId: expense.userId }
    })
  }
}
