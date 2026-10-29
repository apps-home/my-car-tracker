import type { MyCarTracker } from '@lib/my-car-tracker-db'
import { Inject, Injectable } from '@nestjs/common'

import { toDateRange } from '@/core/utils/date-range'

import type { ListFuelLogsParams } from '../../domain/dto/fuel-log.payload'
import { FuelLog } from '../../domain/fuel-log.entity'
import { FuelLogRepository } from '../../domain/fuel-log.repository'
import { PrismaFuelLogMapper } from './prisma.fuel-log.mapper'

@Injectable()
export class PrismaFuelLogRepository implements FuelLogRepository {
  constructor(@Inject('prismaMyCarTracker') private prisma: MyCarTracker) {}

  async findById(id: string, userId: string): Promise<FuelLog | null> {
    const fuelLog = await this.prisma.fuelLog.findFirst({
      where: { id, userId }
    })

    if (!fuelLog) {
      return null
    }

    return PrismaFuelLogMapper.toDomain(fuelLog)
  }

  async list({
    userId,
    vehicleId,
    fuelType,
    ...period
  }: ListFuelLogsParams): Promise<FuelLog[]> {
    const fuelLogs = await this.prisma.fuelLog.findMany({
      where: {
        userId,
        vehicleId,
        fuelType,
        date: toDateRange(period)
      },
      orderBy: [{ date: 'desc' }, { odometerKm: 'desc' }]
    })

    return fuelLogs.map(PrismaFuelLogMapper.toDomain)
  }

  async findAllByVehicle(
    vehicleId: string,
    userId: string
  ): Promise<FuelLog[]> {
    const fuelLogs = await this.prisma.fuelLog.findMany({
      where: { vehicleId, userId },
      orderBy: [{ odometerKm: 'asc' }, { date: 'asc' }]
    })

    return fuelLogs.map(PrismaFuelLogMapper.toDomain)
  }

  async create(fuelLog: FuelLog): Promise<void> {
    await this.prisma.fuelLog.create({
      data: PrismaFuelLogMapper.toPrisma(fuelLog)
    })
  }

  async save(fuelLog: FuelLog): Promise<void> {
    const { id, vehicleId, userId, createdAt, ...data } =
      PrismaFuelLogMapper.toPrisma(fuelLog)

    await this.prisma.fuelLog.update({
      where: { id, userId },
      data
    })
  }

  async saveConsumption(fuelLogs: FuelLog[]): Promise<void> {
    if (!fuelLogs.length) {
      return
    }

    await this.prisma.$transaction(
      fuelLogs.map((fuelLog) =>
        this.prisma.fuelLog.update({
          where: { id: fuelLog.id, userId: fuelLog.userId },
          data: {
            distanceDrivenKm: fuelLog.distanceDrivenKm,
            consumptionKmPerLiter: fuelLog.consumptionKmPerLiter,
            costPerKm: fuelLog.costPerKm,
            updatedAt: fuelLog.updatedAt
          }
        })
      )
    )
  }

  async delete(fuelLog: FuelLog): Promise<void> {
    await this.prisma.fuelLog.delete({
      where: { id: fuelLog.id, userId: fuelLog.userId }
    })
  }
}
