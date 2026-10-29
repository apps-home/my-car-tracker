import type { ListSchedulesParams } from '@/modules/schedules/domain/dto/schedule.payload'
import { MaintenanceSchedule } from '@/modules/schedules/domain/schedule.entity'
import { ScheduleMapper } from '@/modules/schedules/domain/schedule.mapper'
import type { ScheduleRepository } from '@/modules/schedules/domain/schedule.repository'

/** Devolve cópias, como o banco: alterar uma entidade sem `save` não muda `items` */
function clone(schedule: MaintenanceSchedule): MaintenanceSchedule {
  return new MaintenanceSchedule(ScheduleMapper.toProps(schedule))
}

export class InMemoryScheduleRepository implements ScheduleRepository {
  public items: MaintenanceSchedule[] = []
  /** Veículos inativos, para o findAllActiveForSystem (no Prisma vem do join) */
  public inactiveVehicleIds = new Set<string>()

  async findById(
    id: string,
    userId: string
  ): Promise<MaintenanceSchedule | null> {
    const schedule = this.items.find(
      (item) => item.id === id && item.userId === userId
    )
    return schedule ? clone(schedule) : null
  }

  async findManyByIds(
    ids: string[],
    userId: string
  ): Promise<MaintenanceSchedule[]> {
    return this.items
      .filter((item) => ids.includes(item.id) && item.userId === userId)
      .map(clone)
  }

  async list({
    userId,
    vehicleId,
    includeInactive
  }: Omit<ListSchedulesParams, 'alertStatus'>): Promise<MaintenanceSchedule[]> {
    return this.items
      .filter((item) => item.userId === userId)
      .filter((item) => !vehicleId || item.vehicleId === vehicleId)
      .filter((item) => includeInactive || item.isActive)
      .map(clone)
  }

  async findActiveByVehicleForSystem(
    vehicleId: string
  ): Promise<MaintenanceSchedule[]> {
    return this.items
      .filter((item) => item.vehicleId === vehicleId && item.isActive)
      .map(clone)
  }

  async findAllActiveForSystem(): Promise<MaintenanceSchedule[]> {
    return this.items
      .filter(
        (item) => item.isActive && !this.inactiveVehicleIds.has(item.vehicleId)
      )
      .map(clone)
  }

  async create(schedule: MaintenanceSchedule): Promise<void> {
    this.items.push(clone(schedule))
  }

  async createMany(schedules: MaintenanceSchedule[]): Promise<void> {
    this.items.push(...schedules.map(clone))
  }

  async save(schedule: MaintenanceSchedule): Promise<void> {
    const index = this.items.findIndex((item) => item.id === schedule.id)
    this.items[index] = clone(schedule)
  }

  async saveMany(schedules: MaintenanceSchedule[]): Promise<void> {
    for (const schedule of schedules) {
      await this.save(schedule)
    }
  }

  async delete(schedule: MaintenanceSchedule): Promise<void> {
    this.items = this.items.filter((item) => item.id !== schedule.id)
  }

  byId(id: string): MaintenanceSchedule | undefined {
    return this.items.find((item) => item.id === id)
  }
}
