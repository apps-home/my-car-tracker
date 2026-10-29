import type { MyCarTracker } from '@lib/my-car-tracker-db'
import { Inject, Injectable } from '@nestjs/common'

import type { ListVehiclesParams } from '../../domain/dto/vehicle.payload'
import { Vehicle } from '../../domain/vehicle.entity'
import { VehicleRepository } from '../../domain/vehicle.repository'
import { PrismaVehicleMapper } from './prisma.vehicle.mapper'

@Injectable()
export class PrismaVehicleRepository implements VehicleRepository {
  constructor(@Inject('prismaMyCarTracker') private prisma: MyCarTracker) {}

  async findById(id: string, userId: string): Promise<Vehicle | null> {
    const vehicle = await this.prisma.vehicle.findFirst({
      where: { id, userId }
    })

    if (!vehicle) {
      return null
    }

    return PrismaVehicleMapper.toDomain(vehicle)
  }

  async list({ userId, status }: ListVehiclesParams): Promise<Vehicle[]> {
    const vehicles = await this.prisma.vehicle.findMany({
      where: {
        userId,
        ...(status && { isActive: status === 'ACTIVE' })
      },
      orderBy: [{ isActive: 'desc' }, { createdAt: 'desc' }]
    })

    return vehicles.map(PrismaVehicleMapper.toDomain)
  }

  async findManyByIdsForSystem(ids: string[]): Promise<Vehicle[]> {
    if (!ids.length) {
      return []
    }

    const vehicles = await this.prisma.vehicle.findMany({
      where: { id: { in: ids } }
    })

    return vehicles.map(PrismaVehicleMapper.toDomain)
  }

  async create(vehicle: Vehicle): Promise<void> {
    await this.prisma.vehicle.create({
      data: PrismaVehicleMapper.toPrisma(vehicle)
    })
  }

  async save(vehicle: Vehicle): Promise<void> {
    const { id, userId, createdAt, ...data } =
      PrismaVehicleMapper.toPrisma(vehicle)

    await this.prisma.vehicle.update({
      where: { id, userId },
      data
    })
  }

  async delete(vehicle: Vehicle): Promise<void> {
    await this.prisma.vehicle.delete({
      where: { id: vehicle.id, userId: vehicle.userId }
    })
  }
}
