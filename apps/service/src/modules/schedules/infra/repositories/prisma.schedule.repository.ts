import type { MyCarTracker } from '@lib/my-car-tracker-db'
import { Inject, Injectable } from '@nestjs/common'

import type { ListSchedulesParams } from '../../domain/dto/schedule.payload'
import { MaintenanceSchedule } from '../../domain/schedule.entity'
import { ScheduleRepository } from '../../domain/schedule.repository'
import { PrismaScheduleMapper } from './prisma.schedule.mapper'

@Injectable()
export class PrismaScheduleRepository implements ScheduleRepository {
  constructor(@Inject('prismaMyCarTracker') private prisma: MyCarTracker) {}

  async findById(
    id: string,
    userId: string
  ): Promise<MaintenanceSchedule | null> {
    const schedule = await this.prisma.maintenanceSchedule.findFirst({
      where: { id, userId }
    })

    return schedule ? PrismaScheduleMapper.toDomain(schedule) : null
  }

  async findManyByIds(
    ids: string[],
    userId: string
  ): Promise<MaintenanceSchedule[]> {
    if (!ids.length) return []

    const schedules = await this.prisma.maintenanceSchedule.findMany({
      where: { id: { in: ids }, userId }
    })

    return schedules.map(PrismaScheduleMapper.toDomain)
  }

  async list({
    userId,
    vehicleId,
    includeInactive
  }: Omit<ListSchedulesParams, 'alertStatus'>): Promise<MaintenanceSchedule[]> {
    const schedules = await this.prisma.maintenanceSchedule.findMany({
      where: {
        userId,
        vehicleId,
        ...(!includeInactive && { isActive: true })
      },
      orderBy: { createdAt: 'asc' }
    })

    return schedules.map(PrismaScheduleMapper.toDomain)
  }

  async findActiveByVehicleForSystem(
    vehicleId: string
  ): Promise<MaintenanceSchedule[]> {
    const schedules = await this.prisma.maintenanceSchedule.findMany({
      where: { vehicleId, isActive: true }
    })

    return schedules.map(PrismaScheduleMapper.toDomain)
  }

  async findAllActiveForSystem(): Promise<MaintenanceSchedule[]> {
    const schedules = await this.prisma.maintenanceSchedule.findMany({
      where: { isActive: true, vehicle: { isActive: true } }
    })

    return schedules.map(PrismaScheduleMapper.toDomain)
  }

  async create(schedule: MaintenanceSchedule): Promise<void> {
    await this.prisma.maintenanceSchedule.create({
      data: PrismaScheduleMapper.toPrisma(schedule)
    })
  }

  async createMany(schedules: MaintenanceSchedule[]): Promise<void> {
    if (!schedules.length) return

    await this.prisma.maintenanceSchedule.createMany({
      data: schedules.map(PrismaScheduleMapper.toPrisma)
    })
  }

  async save(schedule: MaintenanceSchedule): Promise<void> {
    const { id, vehicleId, userId, createdAt, ...data } =
      PrismaScheduleMapper.toPrisma(schedule)

    await this.prisma.maintenanceSchedule.update({
      where: { id, userId },
      data
    })
  }

  async saveMany(schedules: MaintenanceSchedule[]): Promise<void> {
    if (!schedules.length) return

    await this.prisma.$transaction(
      schedules.map((schedule) => {
        const { id, vehicleId, userId, createdAt, ...data } =
          PrismaScheduleMapper.toPrisma(schedule)

        return this.prisma.maintenanceSchedule.update({
          where: { id, userId },
          data
        })
      })
    )
  }

  async delete(schedule: MaintenanceSchedule): Promise<void> {
    await this.prisma.maintenanceSchedule.delete({
      where: { id: schedule.id, userId: schedule.userId }
    })
  }
}
