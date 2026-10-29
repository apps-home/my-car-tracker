import { Injectable } from '@nestjs/common'

import { Either, left, right } from '@/core/utils/Either'
import { addDaysUtc, startOfDayUtc } from '@/core/utils/utc-date'
import { VehicleNotFoundError } from '@/modules/vehicles/application/errors/vehicle-not-found.error'
import { VehicleRepository } from '@/modules/vehicles/domain/vehicle.repository'

import type { ExpenseSuggestionsParams } from '../../domain/dto/expense.payload'
import { ExpenseRepository } from '../../domain/expense.repository'
import {
  buildExpenseSuggestions,
  type ExpenseSuggestion
} from '../../domain/expense-suggestions'

type Response = Either<VehicleNotFoundError, ExpenseSuggestion[]>

/** Janela dos lançamentos considerados: o que você passa hoje, não o de anos atrás */
const SUGGESTION_WINDOW_DAYS = 180
const SUGGESTION_LIMIT = 8

@Injectable()
export class ListExpenseSuggestionsUseCase {
  constructor(
    private expenseRepository: ExpenseRepository,
    private vehicleRepository: VehicleRepository
  ) {}

  async execute({
    userId,
    vehicleId,
    category
  }: ExpenseSuggestionsParams): Promise<Response> {
    const vehicle = await this.vehicleRepository.findById(vehicleId, userId)

    if (!vehicle) {
      return left(new VehicleNotFoundError())
    }

    const expenses = await this.expenseRepository.list({
      userId,
      vehicleId,
      category,
      from: addDaysUtc(startOfDayUtc(new Date()), -SUGGESTION_WINDOW_DAYS)
    })

    return right(buildExpenseSuggestions(expenses, SUGGESTION_LIMIT))
  }
}
