import { Module } from '@nestjs/common'

import { VehicleModule } from '../vehicles/vehicle.module'
import { CreateExpenseUseCase } from './application/use-cases/create-expense'
import { DeleteExpenseUseCase } from './application/use-cases/delete-expense'
import { FindExpenseByIdUseCase } from './application/use-cases/find-expense'
import { ListExpenseSuggestionsUseCase } from './application/use-cases/list-expense-suggestions'
import { ListExpensesUseCase } from './application/use-cases/list-expenses'
import { UpdateExpenseUseCase } from './application/use-cases/update-expense'
import { ExpenseRepository } from './domain/expense.repository'
import { ExpenseController } from './infra/expense.controller'
import { PrismaExpenseRepository } from './infra/repositories/prisma.expense.repository'

@Module({
  imports: [VehicleModule],
  controllers: [ExpenseController],
  providers: [
    { provide: ExpenseRepository, useClass: PrismaExpenseRepository },
    CreateExpenseUseCase,
    ListExpensesUseCase,
    ListExpenseSuggestionsUseCase,
    FindExpenseByIdUseCase,
    UpdateExpenseUseCase,
    DeleteExpenseUseCase
  ],
  exports: [ExpenseRepository]
})
export class ExpenseModule {}
