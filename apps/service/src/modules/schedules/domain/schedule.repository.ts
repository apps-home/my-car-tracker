import type { ListSchedulesParams } from './dto/schedule.payload'
import type { MaintenanceSchedule } from './schedule.entity'

export abstract class ScheduleRepository {
  abstract findById(
    id: string,
    userId: string
  ): Promise<MaintenanceSchedule | null>
  abstract findManyByIds(
    ids: string[],
    userId: string
  ): Promise<MaintenanceSchedule[]>
  /** Filtra por veículo e ativos; o status é avaliado no caso de uso */
  abstract list(
    params: Omit<ListSchedulesParams, 'alertStatus'>
  ): Promise<MaintenanceSchedule[]>
  /** Sem usuário (listener e cron) */
  abstract findActiveByVehicleForSystem(
    vehicleId: string
  ): Promise<MaintenanceSchedule[]>
  /** Sem usuário (cron diário) */
  abstract findAllActiveForSystem(): Promise<MaintenanceSchedule[]>
  abstract create(schedule: MaintenanceSchedule): Promise<void>
  abstract createMany(schedules: MaintenanceSchedule[]): Promise<void>
  abstract save(schedule: MaintenanceSchedule): Promise<void>
  abstract saveMany(schedules: MaintenanceSchedule[]): Promise<void>
  abstract delete(schedule: MaintenanceSchedule): Promise<void>
}
