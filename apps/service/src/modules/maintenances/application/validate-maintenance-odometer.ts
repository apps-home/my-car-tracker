import { PayloadError } from '@/core/domain/errors/payload-error'
import type { Vehicle } from '@/modules/vehicles/domain/vehicle.entity'

import type { Maintenance } from '../domain/maintenance.entity'

export function validateMaintenanceOdometer(
  vehicle: Vehicle,
  maintenance: Maintenance
): PayloadError | null {
  if (maintenance.odometerKm < vehicle.initialOdometerKm) {
    return new PayloadError(
      `odometerKm must not be lower than the vehicle initial odometer (${vehicle.initialOdometerKm} km)`
    )
  }

  return null
}
