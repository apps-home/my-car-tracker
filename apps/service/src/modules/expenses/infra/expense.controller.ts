import { CurrentUserId } from '@lib/auth/nest'
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query
} from '@nestjs/common'

import { toHttpException } from '@/infra/http/to-http-exception'

import { CreateExpenseUseCase } from '../application/use-cases/create-expense'
import { DeleteExpenseUseCase } from '../application/use-cases/delete-expense'
import { FindExpenseByIdUseCase } from '../application/use-cases/find-expense'
import { ListExpenseSuggestionsUseCase } from '../application/use-cases/list-expense-suggestions'
import { ListExpensesUseCase } from '../application/use-cases/list-expenses'
import { UpdateExpenseUseCase } from '../application/use-cases/update-expense'
import {
  CreateExpenseDTO,
  ExpenseSuggestionsQueryDTO,
  ListExpensesQueryDTO,
  UpdateExpenseDTO
} from './expense.dto'

@Controller('expenses')
export class ExpenseController {
  constructor(
    private readonly createExpenseUseCase: CreateExpenseUseCase,
    private readonly listExpensesUseCase: ListExpensesUseCase,
    private readonly listExpenseSuggestionsUseCase: ListExpenseSuggestionsUseCase,
    private readonly findExpenseByIdUseCase: FindExpenseByIdUseCase,
    private readonly updateExpenseUseCase: UpdateExpenseUseCase,
    private readonly deleteExpenseUseCase: DeleteExpenseUseCase
  ) {}

  @Post()
  async create(
    @Body() data: CreateExpenseDTO,
    @CurrentUserId() userId: string
  ) {
    const result = await this.createExpenseUseCase.execute(userId, data)

    if (result.isLeft()) {
      throw toHttpException(result.value)
    }

    return { message: 'Expense created successfully', id: result.value.id }
  }

  @Get()
  async list(
    @Query() query: ListExpensesQueryDTO,
    @CurrentUserId() userId: string
  ) {
    const result = await this.listExpensesUseCase.execute({ ...query, userId })

    return result.value
  }

  @Get('suggestions')
  async suggestions(
    @Query() query: ExpenseSuggestionsQueryDTO,
    @CurrentUserId() userId: string
  ) {
    const result = await this.listExpenseSuggestionsUseCase.execute({
      ...query,
      userId
    })

    if (result.isLeft()) {
      throw toHttpException(result.value)
    }

    return result.value
  }

  @Get(':id')
  async findById(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @CurrentUserId() userId: string
  ) {
    const result = await this.findExpenseByIdUseCase.execute(userId, id)

    if (result.isLeft()) {
      throw toHttpException(result.value)
    }

    return result.value
  }

  @Patch(':id')
  async update(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body() data: UpdateExpenseDTO,
    @CurrentUserId() userId: string
  ) {
    const result = await this.updateExpenseUseCase.execute(userId, id, data)

    if (result.isLeft()) {
      throw toHttpException(result.value)
    }

    return { message: 'Expense updated successfully' }
  }

  @Delete(':id')
  async delete(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @CurrentUserId() userId: string
  ) {
    const result = await this.deleteExpenseUseCase.execute(userId, id)

    if (result.isLeft()) {
      throw toHttpException(result.value)
    }

    return { message: 'Expense deleted successfully' }
  }
}
