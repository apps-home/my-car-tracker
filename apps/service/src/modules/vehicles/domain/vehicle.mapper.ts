import type { Vehicle, VehicleProps } from './vehicle.entity'

export type VehicleHTTP = Omit<VehicleProps, 'userId'>

export class VehicleMapper {
  static toHTTP(vehicle: Vehicle): VehicleHTTP {
    return {
      id: vehicle.id,
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
