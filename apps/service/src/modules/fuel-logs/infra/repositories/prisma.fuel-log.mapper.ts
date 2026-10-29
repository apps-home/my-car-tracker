import type { Prisma } from '@lib/my-car-tracker-db'

import { FuelLog } from '../../domain/fuel-log.entity'

export class PrismaFuelLogMapper {
  static toDomain(raw: Prisma.FuelLogGetPayload<{}>): FuelLog {
    return new FuelLog({
      id: raw.id,
      vehicleId: raw.vehicleId,
      userId: raw.userId,
      date: raw.date,
      odometerKm: raw.odometerKm,
      fuelType: raw.fuelType,
      liters: raw.liters.toNumber(),
      pricePerLiter: raw.pricePerLiter.toNumber(),
      totalCost: raw.totalCost.toNumber(),
      reimbursedAmount: raw.reimbursedAmount?.toNumber() ?? 0,
      sharedWith: raw.sharedWith ?? null,
      isFullTank: raw.isFullTank,
      gasStationName: raw.gasStationName,
      paymentMethod: raw.paymentMethod,
      distanceDrivenKm: raw.distanceDrivenKm,
      consumptionKmPerLiter: raw.consumptionKmPerLiter?.toNumber() ?? null,
      costPerKm: raw.costPerKm?.toNumber() ?? null,
      notes: raw.notes,
      createdAt: raw.createdAt,
      updatedAt: raw.updatedAt
    })
  }

  static toPrisma(fuelLog: FuelLog): Prisma.FuelLogUncheckedCreateInput {
    return {
      id: fuelLog.id,
      vehicleId: fuelLog.vehicleId,
      userId: fuelLog.userId,
      date: fuelLog.date,
      odometerKm: fuelLog.odometerKm,
      fuelType: fuelLog.fuelType,
      liters: fuelLog.liters,
      pricePerLiter: fuelLog.pricePerLiter,
      totalCost: fuelLog.totalCost,
      reimbursedAmount: fuelLog.reimbursedAmount,
      sharedWith: fuelLog.sharedWith,
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
