import { PayloadError } from '@/core/domain/errors/payload-error'
import type { Vehicle } from '@/modules/vehicles/domain/vehicle.entity'

import type { MaintenanceSchedule } from '../domain/schedule.entity'

/** A última execução não pode ter km acima do km atual do veículo */
export function validateScheduleOdometer(
  vehicle: Vehicle,
  schedule: MaintenanceSchedule
): PayloadError | null {
  if (
    schedule.lastExecutedOdometerKm !== null &&
    schedule.lastExecutedOdometerKm > vehicle.currentOdometerKm
  ) {
    return new PayloadError(
      `lastExecutedOdometerKm must not be higher than the vehicle current odometer (${vehicle.currentOdometerKm} km)`
    )
  }

  return null
}
