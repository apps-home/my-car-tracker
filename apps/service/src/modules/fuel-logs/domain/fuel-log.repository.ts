import type { ListFuelLogsParams } from './dto/fuel-log.payload'
import type { FuelLog } from './fuel-log.entity'

export abstract class FuelLogRepository {
  abstract findById(id: string, userId: string): Promise<FuelLog | null>
  /** Ordenado por data, do mais recente para o mais antigo */
  abstract list(params: ListFuelLogsParams): Promise<FuelLog[]>
  /** Todos os abastecimentos do veículo, para o recálculo em cadeia */
  abstract findAllByVehicle(
    vehicleId: string,
    userId: string
  ): Promise<FuelLog[]>
  abstract create(fuelLog: FuelLog): Promise<void>
  abstract save(fuelLog: FuelLog): Promise<void>
  /** Grava só os campos calculados (distância, consumo e custo por km) */
  abstract saveConsumption(fuelLogs: FuelLog[]): Promise<void>
  abstract delete(fuelLog: FuelLog): Promise<void>
}
