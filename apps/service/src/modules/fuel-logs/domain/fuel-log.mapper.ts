import type { FuelLog, FuelLogProps } from './fuel-log.entity'

export type FuelLogHTTP = Omit<Required<FuelLogProps>, 'userId'> & {
  netCost: number
}

export class FuelLogMapper {
  static toHTTP(fuelLog: FuelLog): FuelLogHTTP {
    return {
      id: fuelLog.id,
      vehicleId: fuelLog.vehicleId,
      date: fuelLog.date,
      odometerKm: fuelLog.odometerKm,
      fuelType: fuelLog.fuelType,
      liters: fuelLog.liters,
      pricePerLiter: fuelLog.pricePerLiter,
      totalCost: fuelLog.totalCost,
      reimbursedAmount: fuelLog.reimbursedAmount,
      sharedWith: fuelLog.sharedWith,
      netCost: fuelLog.netCost,
      isFullTank: fuelLog.isFullTank,
      gasStationName: fuelLog.gasStationName,
      paymentMethod: fuelLog.paymentMethod,
      distanceDrivenKm: fuelLog.distanceDrivenKm,
      consumptionKmPerLiter: fuelLog.consumptionKmPerLiter,
      costPerKm: fuelLog.costPerKm,
      notes: fuelLog.notes,
      createdAt: fuelLog.createdAt,
      updatedAt: fuelLog.updatedAt
    }
  }
}
