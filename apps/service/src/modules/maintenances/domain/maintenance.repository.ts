import type {
  ListMaintenancesParams,
  ListWarrantiesParams
} from './dto/maintenance.payload'
import type { Maintenance, MaintenanceExecution } from './maintenance.entity'
import type { MaintenanceType } from './maintenance-type'

export interface ActiveWarranty {
  itemId: string
  maintenanceId: string
  maintenanceTitle: string
  maintenanceType: MaintenanceType
  vehicleId: string
  date: Date
  workshopName: string | null
  name: string
  brand: string | null
  partNumber: string | null
  totalPrice: number
  warrantyMonths: number
  warrantyUntil: Date
}

export abstract class MaintenanceRepository {
  abstract findById(id: string, userId: string): Promise<Maintenance | null>
  /** Ordenado por data, da mais recente para a mais antiga */
  abstract list(params: ListMaintenancesParams): Promise<Maintenance[]>
  /** Manutenção mais recente com algum item ligado ao plano */
  abstract findLatestExecutionForSchedule(
    scheduleId: string,
    userId: string
  ): Promise<MaintenanceExecution | null>
  /** Ordenado pelo fim da garantia, do mais próximo para o mais distante */
  abstract listActiveWarranties(
    params: ListWarrantiesParams
  ): Promise<ActiveWarranty[]>
  abstract create(maintenance: Maintenance): Promise<void>
  /** Grava o registro e substitui a lista de itens */
  abstract save(maintenance: Maintenance): Promise<void>
  abstract delete(maintenance: Maintenance): Promise<void>
}
