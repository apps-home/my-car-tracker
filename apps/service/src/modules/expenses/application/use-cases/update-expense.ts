import { Injectable } from '@nestjs/common'

import { PayloadError } from '@/core/domain/errors/payload-error'
import { Either, left, right } from '@/core/utils/Either'
import { SyncVehicleOdometerService } from '@/modules/vehicles/application/services/sync-vehicle-odometer'
import { VehicleRepository } from '@/modules/vehicles/domain/vehicle.repository'

import type { UpdateExpensePayload } from '../../domain/dto/expense.payload'
import { ExpenseRepository } from '../../domain/expense.repository'
import { ExpenseNotFoundError } from '../errors/expense-not-found.error'
import { validateExpenseOdometer } from '../validate-expense-odometer'

type Response = Either<ExpenseNotFoundError | PayloadError, void>

@Injectable()
export class UpdateExpenseUseCase {
  constructor(
    private expenseRepository: ExpenseRepository,
    private vehicleRepository: VehicleRepository,
    private syncVehicleOdometer: SyncVehicleOdometerService
  ) {}

  async execute(
    userId: string,
    id: string,
    data: UpdateExpensePayload
  ): Promise<Response> {
    const expense = await this.expenseRepository.findById(id, userId)

    if (!expense) {
      return left(new ExpenseNotFoundError())
    }

    const vehicle = await this.vehicleRepository.findById(
      expense.vehicleId,
      userId
    )

    if (!vehicle) {
      return left(new ExpenseNotFoundError())
    }

    try {
      expense.update(data)
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

    await this.expenseRepository.save(expense)

    if (expense.odometerKm !== null) {
      await this.syncVehicleOdometer.execute(vehicle, expense.odometerKm)
    }

    return right(void 0)
  }
}
