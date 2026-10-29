import { PayloadError } from '@/core/domain/errors/payload-error'
import type { Vehicle } from '@/modules/vehicles/domain/vehicle.entity'

import {
  calculateConsumption,
  findOdometerConflict
} from '../domain/fuel-consumption'
import type { FuelLog } from '../domain/fuel-log.entity'

/**
 * Recalcula o consumo de todos os abastecimentos do veículo
 * e devolve os que mudaram (para gravar só esses).
 */
export function recalculateChain(fuelLogs: FuelLog[]): FuelLog[] {
  const results = calculateConsumption(fuelLogs)

  return fuelLogs.filter((fuelLog) => {
    const result = results.get(fuelLog.id)

    return result ? fuelLog.applyConsumption(result) : false
  })
}

/** O odômetro do abastecimento precisa ser coerente com o veículo e com os demais registros */
export function validateOdometer(
  vehicle: Vehicle,
  fuelLogs: FuelLog[],
  candidate: FuelLog
): PayloadError | null {
  if (candidate.odometerKm < vehicle.initialOdometerKm) {
    return new PayloadError(
      `odometerKm must not be lower than the vehicle initial odometer (${vehicle.initialOdometerKm} km)`
    )
  }

  const conflict = findOdometerConflict(fuelLogs, candidate)

  if (conflict) {
    return new PayloadError(
      `odometerKm conflicts with the fuel log of ${conflict.date.toISOString().slice(0, 10)} (${conflict.odometerKm} km)`
    )
  }

  return null
}
