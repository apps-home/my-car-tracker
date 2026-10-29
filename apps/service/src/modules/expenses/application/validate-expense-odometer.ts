import { PayloadError } from '@/core/domain/errors/payload-error'
import type { Vehicle } from '@/modules/vehicles/domain/vehicle.entity'

import type { Expense } from '../domain/expense.entity'

/** O km informado numa despesa não pode ser anterior ao km de cadastro do veículo */
export function validateExpenseOdometer(
  vehicle: Vehicle,
  expense: Expense
): PayloadError | null {
  if (
    expense.odometerKm !== null &&
    expense.odometerKm < vehicle.initialOdometerKm
  ) {
    return new PayloadError(
      `odometerKm must not be lower than the vehicle initial odometer (${vehicle.initialOdometerKm} km)`
    )
  }

  return null
}
