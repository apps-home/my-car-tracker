import { isInDateRange, toDateRange } from '@/core/utils/date-range'
import type {
  ListMaintenancesParams,
  ListWarrantiesParams
} from '@/modules/maintenances/domain/dto/maintenance.payload'
import {
  Maintenance,
  type MaintenanceExecution
} from '@/modules/maintenances/domain/maintenance.entity'
import { MaintenanceMapper } from '@/modules/maintenances/domain/maintenance.mapper'
import type {
  ActiveWarranty,
  MaintenanceRepository
} from '@/modules/maintenances/domain/maintenance.repository'

/** Devolve cópias, como o banco: alterar uma entidade sem `save` não muda `items` */
function clone(maintenance: Maintenance): Maintenance {
  return new Maintenance(MaintenanceMapper.toProps(maintenance))
}

function byDateDesc(a: Maintenance, b: Maintenance) {
  return b.date.getTime() - a.date.getTime() || b.odometerKm - a.odometerKm
}

export class InMemoryMaintenanceRepository implements MaintenanceRepository {
  public items: Maintenance[] = []

  async findById(id: string, userId: string): Promise<Maintenance | null> {
    const maintenance = this.items.find(
      (item) => item.id === id && item.userId === userId
    )
    return maintenance ? clone(maintenance) : null
  }

  async list({
    userId,
    vehicleId,
    type,
    search,
    ...period
  }: ListMaintenancesParams): Promise<Maintenance[]> {
    const range = toDateRange(period)
    const term = search?.trim().toLowerCase()
    const matches = (value: string | null) =>
      !!value?.toLowerCase().includes(term as string)

    return this.items
      .filter((item) => item.userId === userId)
      .filter((item) => !vehicleId || item.vehicleId === vehicleId)
      .filter((item) => !type || item.type === type)
      .filter((item) => isInDateRange(item.date, range))
      .filter(
        (item) =>
          !term ||
          matches(item.title) ||
          matches(item.workshopName) ||
          matches(item.notes) ||
          item.items.some(
            (part) =>
              matches(part.name) ||
              matches(part.brand) ||
              matches(part.partNumber)
          )
      )
      .sort(byDateDesc)
      .map(clone)
  }

  async findLatestExecutionForSchedule(
    scheduleId: string,
    userId: string
  ): Promise<MaintenanceExecution | null> {
    const latest = this.items
      .filter(
        (item) =>
          item.userId === userId && item.scheduleIds.includes(scheduleId)
      )
      .sort(byDateDesc)[0]

    return latest ? latest.execution : null
  }

  async listActiveWarranties({
    userId,
    vehicleId,
    activeOn
  }: ListWarrantiesParams): Promise<ActiveWarranty[]> {
    return this.items
      .filter((item) => item.userId === userId)
      .filter((item) => !vehicleId || item.vehicleId === vehicleId)
      .flatMap((maintenance) =>
        maintenance.items
          .filter(
            (part) => part.warrantyUntil && part.warrantyUntil >= activeOn
          )
          .map((part) => ({
            itemId: part.id,
            maintenanceId: maintenance.id,
            maintenanceTitle: maintenance.title,
            maintenanceType: maintenance.type,
            vehicleId: maintenance.vehicleId,
            date: maintenance.date,
            workshopName: maintenance.workshopName,
            name: part.name,
            brand: part.brand,
            partNumber: part.partNumber,
            totalPrice: part.totalPrice,
            warrantyMonths: part.warrantyMonths as number,
            warrantyUntil: part.warrantyUntil as Date
          }))
      )
      .sort((a, b) => a.warrantyUntil.getTime() - b.warrantyUntil.getTime())
  }

  async create(maintenance: Maintenance): Promise<void> {
    this.items.push(clone(maintenance))
  }

  async save(maintenance: Maintenance): Promise<void> {
    const index = this.items.findIndex((item) => item.id === maintenance.id)
    this.items[index] = clone(maintenance)
  }

  async delete(maintenance: Maintenance): Promise<void> {
    this.items = this.items.filter((item) => item.id !== maintenance.id)
  }

  byId(id: string): Maintenance | undefined {
    return this.items.find((item) => item.id === id)
  }
}
