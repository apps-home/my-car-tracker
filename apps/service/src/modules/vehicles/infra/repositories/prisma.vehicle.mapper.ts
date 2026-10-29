import type { Prisma } from '@lib/my-car-tracker-db'

import { Vehicle } from '../../domain/vehicle.entity'

export class PrismaVehicleMapper {
  static toDomain(raw: Prisma.VehicleGetPayload<{}>): Vehicle {
    return new Vehicle({
      id: raw.id,
      userId: raw.userId,
      name: raw.name,
      brand: raw.brand,
      model: raw.model,
      modelYear: raw.modelYear,
      manufactureYear: raw.manufactureYear,
      licensePlate: raw.licensePlate,
      color: raw.color,
      currentOdometerKm: raw.currentOdometerKm,
      initialOdometerKm: raw.initialOdometerKm,
      fuelTankCapacityLiters: raw.fuelTankCapacityLiters,
      defaultFuelType: raw.defaultFuelType,
      photoUrl: raw.photoUrl,
      isActive: raw.isActive,
      notes: raw.notes,
      createdAt: raw.createdAt,
      updatedAt: raw.updatedAt
    })
  }

  static toPrisma(vehicle: Vehicle): Prisma.VehicleUncheckedCreateInput {
    return {
      id: vehicle.id,
      userId: vehicle.userId,
      name: vehicle.name,
      brand: vehicle.brand,
      model: vehicle.model,
      modelYear: vehicle.modelYear,
      manufactureYear: vehicle.manufactureYear,
      licensePlate: vehicle.licensePlate,
      color: vehicle.color,
      currentOdometerKm: vehicle.currentOdometerKm,
      initialOdometerKm: vehicle.initialOdometerKm,
      fuelTankCapacityLiters: vehicle.fuelTankCapacityLiters,
      defaultFuelType: vehicle.defaultFuelType,
      photoUrl: vehicle.photoUrl,
      isActive: vehicle.isActive,
      notes: vehicle.notes,
      createdAt: vehicle.createdAt,
      updatedAt: vehicle.updatedAt
    }
  }
}
