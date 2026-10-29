import { Injectable } from '@nestjs/common'

import { PayloadError } from '@/core/domain/errors/payload-error'
import { Either, left, right } from '@/core/utils/Either'
import { VehicleNotFoundError } from '@/modules/vehicles/application/errors/vehicle-not-found.error'
import { SyncVehicleOdometerService } from '@/modules/vehicles/application/services/sync-vehicle-odometer'
import { VehicleRepository } from '@/modules/vehicles/domain/vehicle.repository'

import type { CreateExpensePayload } from '../../domain/dto/expense.payload'
import { Expense } from '../../domain/expense.entity'
import { ExpenseHTTP, ExpenseMapper } from '../../domain/expense.mapper'
import { ExpenseRepository } from '../../domain/expense.repository'
import { validateExpenseOdometer } from '../validate-expense-odometer'

type Response = Either<VehicleNotFoundError | PayloadError, ExpenseHTTP>

@Injectable()
export class CreateExpenseUseCase {
  constructor(
    private expenseRepository: ExpenseRepository,
    private vehicleRepository: VehicleRepository,
    private syncVehicleOdometer: SyncVehicleOdometerService
  ) {}

  async execute(userId: string, data: CreateExpensePayload): Promise<Response> {
    const vehicle = await this.vehicleRepository.findById(
      data.vehicleId,
      userId
    )

    if (!vehicle) {
      return left(new VehicleNotFoundError())
    }

    let expense: Expense

    try {
      expense = Expense.create(userId, data)
    } catch (error) {
      if (error instanceof PayloadError) {
        return left(error)
      }

      throw error
    }

    const odometerError = validateExpenseOdometer(vehicle, expense)

    if (odometerError) {
      return left(odometerError)
    }

    await this.expenseRepository.create(expense)

    if (expense.odometerKm !== null) {
      await this.syncVehicleOdometer.execute(vehicle, expense.odometerKm)
    }

    return right(ExpenseMapper.toHTTP(expense))
  }
}
