import type { FuelType } from '../fuel-type'

export interface CreateVehiclePayload {
  name: string
  brand: string
  model: string
  modelYear: number
  manufactureYear?: number | null
  licensePlate?: string | null
  color?: string | null
  initialOdometerKm: number
  /** Sem valor, começa igual ao `initialOdometerKm` */
  currentOdometerKm?: number
  fuelTankCapacityLiters?: number | null
  defaultFuelType?: FuelType
  notes?: string | null
}

export type UpdateVehiclePayload = Partial<
  CreateVehiclePayload & { isActive: boolean }
>

export const VEHICLE_STATUSES = ['ACTIVE', 'INACTIVE'] as const

export type VehicleStatus = (typeof VEHICLE_STATUSES)[number]

export interface ListVehiclesParams {
  userId: string
  status?: VehicleStatus
}
