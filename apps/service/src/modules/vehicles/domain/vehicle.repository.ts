import type { ListVehiclesParams } from './dto/vehicle.payload'
import type { Vehicle } from './vehicle.entity'

export abstract class VehicleRepository {
  abstract findById(id: string, userId: string): Promise<Vehicle | null>
  abstract list(params: ListVehiclesParams): Promise<Vehicle[]>
  abstract create(vehicle: Vehicle): Promise<void>
  abstract save(vehicle: Vehicle): Promise<void>
  abstract delete(vehicle: Vehicle): Promise<void>
}
