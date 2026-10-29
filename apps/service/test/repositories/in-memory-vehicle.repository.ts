import type { ListVehiclesParams } from '@/modules/vehicles/domain/dto/vehicle.payload'
import type { Vehicle } from '@/modules/vehicles/domain/vehicle.entity'
import type { VehicleRepository } from '@/modules/vehicles/domain/vehicle.repository'

export class InMemoryVehicleRepository implements VehicleRepository {
  public items: Vehicle[] = []

  async findById(id: string, userId: string): Promise<Vehicle | null> {
    const vehicle = this.items.find(
      (item) => item.id === id && item.userId === userId
    )
    return vehicle ?? null
  }

  async list({ userId, status }: ListVehiclesParams): Promise<Vehicle[]> {
    return this.items
      .filter((item) => item.userId === userId)
      .filter((item) => !status || item.isActive === (status === 'ACTIVE'))
      .sort(
        (a, b) =>
          Number(b.isActive) - Number(a.isActive) ||
          b.createdAt.getTime() - a.createdAt.getTime()
      )
  }

  async findManyByIdsForSystem(ids: string[]): Promise<Vehicle[]> {
    return this.items.filter((item) => ids.includes(item.id))
  }

  async create(vehicle: Vehicle): Promise<void> {
    this.items.push(vehicle)
  }

  async save(vehicle: Vehicle): Promise<void> {
    const index = this.items.findIndex((item) => item.id === vehicle.id)
    this.items[index] = vehicle
  }

  async delete(vehicle: Vehicle): Promise<void> {
    this.items = this.items.filter((item) => item.id !== vehicle.id)
  }
}
