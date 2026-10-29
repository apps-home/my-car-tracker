import { isInDateRange, toDateRange } from '@/core/utils/date-range'
import type { ListFuelLogsParams } from '@/modules/fuel-logs/domain/dto/fuel-log.payload'
import { FuelLog } from '@/modules/fuel-logs/domain/fuel-log.entity'
import { FuelLogMapper } from '@/modules/fuel-logs/domain/fuel-log.mapper'
import type { FuelLogRepository } from '@/modules/fuel-logs/domain/fuel-log.repository'

/** Devolve cópias, como o banco: alterar uma entidade sem `save` não muda `items` */
function clone(fuelLog: FuelLog): FuelLog {
  return new FuelLog({
    ...FuelLogMapper.toHTTP(fuelLog),
    userId: fuelLog.userId
  })
}

export class InMemoryFuelLogRepository implements FuelLogRepository {
  public items: FuelLog[] = []

  async findById(id: string, userId: string): Promise<FuelLog | null> {
    const fuelLog = this.items.find(
      (item) => item.id === id && item.userId === userId
    )
    return fuelLog ? clone(fuelLog) : null
  }

  async list({
    userId,
    vehicleId,
    fuelType,
    ...period
  }: ListFuelLogsParams): Promise<FuelLog[]> {
    const range = toDateRange(period)

    return this.items
      .filter((item) => item.userId === userId)
      .filter((item) => !vehicleId || item.vehicleId === vehicleId)
      .filter((item) => !fuelType || item.fuelType === fuelType)
      .filter((item) => isInDateRange(item.date, range))
      .sort(
        (a, b) =>
          b.date.getTime() - a.date.getTime() || b.odometerKm - a.odometerKm
      )
      .map(clone)
  }

  async findAllByVehicle(
    vehicleId: string,
    userId: string
  ): Promise<FuelLog[]> {
    return this.items
      .filter((item) => item.vehicleId === vehicleId && item.userId === userId)
      .map(clone)
  }

  async create(fuelLog: FuelLog): Promise<void> {
    this.items.push(clone(fuelLog))
  }

  async save(fuelLog: FuelLog): Promise<void> {
    const index = this.items.findIndex((item) => item.id === fuelLog.id)
    this.items[index] = clone(fuelLog)
  }

  async saveConsumption(fuelLogs: FuelLog[]): Promise<void> {
    for (const fuelLog of fuelLogs) {
      await this.save(fuelLog)
    }
  }

  async delete(fuelLog: FuelLog): Promise<void> {
    this.items = this.items.filter((item) => item.id !== fuelLog.id)
  }

  byId(id: string): FuelLog | undefined {
    return this.items.find((item) => item.id === id)
  }
}
