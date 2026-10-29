import { faker } from '@faker-js/faker'
import { BadRequestException, NotFoundException } from '@nestjs/common'
import { Test } from '@nestjs/testing'
import { makeExpensePayload } from '@test/factories/make-expense'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { PayloadError } from '@/core/domain/errors/payload-error'
import { left, right } from '@/core/utils/Either'
import { VehicleNotFoundError } from '@/modules/vehicles/application/errors/vehicle-not-found.error'

import { ExpenseNotFoundError } from '../application/errors/expense-not-found.error'
import { CreateExpenseUseCase } from '../application/use-cases/create-expense'
import { DeleteExpenseUseCase } from '../application/use-cases/delete-expense'
import { FindExpenseByIdUseCase } from '../application/use-cases/find-expense'
import { ListExpenseSuggestionsUseCase } from '../application/use-cases/list-expense-suggestions'
import { ListExpensesUseCase } from '../application/use-cases/list-expenses'
import { UpdateExpenseUseCase } from '../application/use-cases/update-expense'
import { ExpenseController } from './expense.controller'

describe('ExpenseController', () => {
  let controller: ExpenseController
  const createExpense = { execute: vi.fn() }
  const listExpenses = { execute: vi.fn() }
  const listSuggestions = { execute: vi.fn() }
  const findExpense = { execute: vi.fn() }
  const updateExpense = { execute: vi.fn() }
  const deleteExpense = { execute: vi.fn() }

  beforeEach(async () => {
    vi.clearAllMocks()

    const module = await Test.createTestingModule({
      controllers: [ExpenseController],
      providers: [
        { provide: CreateExpenseUseCase, useValue: createExpense },
        { provide: ListExpensesUseCase, useValue: listExpenses },
        { provide: ListExpenseSuggestionsUseCase, useValue: listSuggestions },
        { provide: FindExpenseByIdUseCase, useValue: findExpense },
        { provide: UpdateExpenseUseCase, useValue: updateExpense },
        { provide: DeleteExpenseUseCase, useValue: deleteExpense }
      ]
    }).compile()

    controller = module.get(ExpenseController)
  })

  it('should answer with a message and the id when the expense is created', async () => {
    const id = faker.string.uuid()
    createExpense.execute.mockResolvedValue(right({ id }))
    const userId = faker.string.alphanumeric(32)
    const dto = makeExpensePayload()

    const response = await controller.create(dto, userId)

    expect(response).toEqual({ message: 'Expense created successfully', id })
    expect(createExpense.execute).toHaveBeenCalledWith(userId, dto)
  })

  it('should throw BadRequestException on PayloadError', async () => {
    createExpense.execute.mockResolvedValue(left(new PayloadError('Invalid')))

    await expect(
      controller.create(makeExpensePayload(), faker.string.alphanumeric(32))
    ).rejects.toThrow(BadRequestException)
  })

  it('should list with the filters and the session user', async () => {
    listExpenses.execute.mockResolvedValue(right([]))
    const userId = faker.string.alphanumeric(32)

    await controller.list({ category: 'TOLL', search: 'ponte' }, userId)

    expect(listExpenses.execute).toHaveBeenCalledWith({
      category: 'TOLL',
      search: 'ponte',
      userId
    })
  })

  it('should throw NotFoundException when the suggestions vehicle is not found', async () => {
    listSuggestions.execute.mockResolvedValue(left(new VehicleNotFoundError()))

    await expect(
      controller.suggestions(
        { vehicleId: faker.string.uuid() },
        faker.string.alphanumeric(32)
      )
    ).rejects.toThrow(NotFoundException)
  })

  it('should throw NotFoundException when the expense is not found', async () => {
    findExpense.execute.mockResolvedValue(left(new ExpenseNotFoundError()))
    updateExpense.execute.mockResolvedValue(left(new ExpenseNotFoundError()))
    deleteExpense.execute.mockResolvedValue(left(new ExpenseNotFoundError()))
    const id = faker.string.uuid()
    const userId = faker.string.alphanumeric(32)

    await expect(controller.findById(id, userId)).rejects.toThrow(
      NotFoundException
    )
    await expect(controller.update(id, { amount: 1 }, userId)).rejects.toThrow(
      NotFoundException
    )
    await expect(controller.delete(id, userId)).rejects.toThrow(
      NotFoundException
    )
  })
})
