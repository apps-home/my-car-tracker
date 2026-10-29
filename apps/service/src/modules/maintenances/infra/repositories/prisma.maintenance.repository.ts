import type { MyCarTracker } from '@lib/my-car-tracker-db'
import { Inject, Injectable } from '@nestjs/common'

import { toDateRange } from '@/core/utils/date-range'

import type {
  ListMaintenancesParams,
  ListWarrantiesParams
} from '../../domain/dto/maintenance.payload'
import type {
  Maintenance,
  MaintenanceExecution
} from '../../domain/maintenance.entity'
import {
  type ActiveWarranty,
  MaintenanceRepository
} from '../../domain/maintenance.repository'
import {
  MAINTENANCE_INCLUDE,
  PrismaMaintenanceMapper
} from './prisma.maintenance.mapper'

@Injectable()
export class PrismaMaintenanceRepository implements MaintenanceRepository {
  constructor(@Inject('prismaMyCarTracker') private prisma: MyCarTracker) {}

  async findById(id: string, userId: string): Promise<Maintenance | null> {
    const maintenance = await this.prisma.maintenanceRecord.findFirst({
      where: { id, userId },
      include: MAINTENANCE_INCLUDE
    })

    return maintenance ? PrismaMaintenanceMapper.toDomain(maintenance) : null
  }

  async list({
    userId,
    vehicleId,
    type,
    search,
    ...period
  }: ListMaintenancesParams): Promise<Maintenance[]> {
    const term = search?.trim()
    const contains = term
      ? { contains: term, mode: 'insensitive' as const }
      : undefined

    const maintenances = await this.prisma.maintenanceRecord.findMany({
      where: {
        userId,
        vehicleId,
        type,
        date: toDateRange(period),
        ...(contains && {
          OR: [
            { title: contains },
            { workshopName: contains },
            { notes: contains },
            {
              items: {
                some: {
                  OR: [
                    { name: contains },
                    { brand: contains },
                    { partNumber: contains }
                  ]
                }
              }
            }
          ]
        })
      },
      include: MAINTENANCE_INCLUDE,
      orderBy: [{ date: 'desc' }, { odometerKm: 'desc' }]
    })

    return maintenances.map(PrismaMaintenanceMapper.toDomain)
  }

  async findLatestExecutionForSchedule(
    scheduleId: string,
    userId: string
  ): Promise<MaintenanceExecution | null> {
    const latest = await this.prisma.maintenanceRecord.findFirst({
      where: { userId, items: { some: { scheduleId } } },
      orderBy: [{ date: 'desc' }, { odometerKm: 'desc' }],
      select: { date: true, odometerKm: true }
    })

    return latest
  }

  async listActiveWarranties({
    userId,
    vehicleId,
    activeOn
  }: ListWarrantiesParams): Promise<ActiveWarranty[]> {
    const items = await this.prisma.maintenanceItem.findMany({
      where: {
        warrantyUntil: { gte: activeOn },
        maintenanceRecord: { userId, vehicleId }
      },
      include: { maintenanceRecord: true },
      orderBy: { warrantyUntil: 'asc' }
    })

    return items.map((item) => ({
      itemId: item.id,
      maintenanceId: item.maintenanceRecordId,
      maintenanceTitle: item.maintenanceRecord.title,
      maintenanceType: item.maintenanceRecord.type,
      vehicleId: item.maintenanceRecord.vehicleId,
      date: item.maintenanceRecord.date,
      workshopName: item.maintenanceRecord.workshopName,
      name: item.name,
      brand: item.brand,
      partNumber: item.partNumber,
      totalPrice: item.totalPrice.toNumber(),
      warrantyMonths: item.warrantyMonths as number,
      warrantyUntil: item.warrantyUntil as Date
    }))
  }

  async create(maintenance: Maintenance): Promise<void> {
    await this.prisma.maintenanceRecord.create({
      data: {
        ...PrismaMaintenanceMapper.toPrismaRecord(maintenance),
        items: {
          createMany: {
            data: maintenance.items.map((item) => ({ ...item }))
          }
        }
      }
    })
  }

  async save(maintenance: Maintenance): Promise<void> {
    const { id, vehicleId, userId, createdAt, ...data } =
      PrismaMaintenanceMapper.toPrismaRecord(maintenance)

    await this.prisma.$transaction([
      this.prisma.maintenanceRecord.update({ where: { id, userId }, data }),
      this.prisma.maintenanceItem.deleteMany({
        where: { maintenanceRecordId: id }
      }),
      this.prisma.maintenanceItem.createMany({
        data: PrismaMaintenanceMapper.toPrismaItems(maintenance)
      })
    ])
  }

  async delete(maintenance: Maintenance): Promise<void> {
    await this.prisma.maintenanceRecord.delete({
      where: { id: maintenance.id, userId: maintenance.userId }
    })
  }
}
