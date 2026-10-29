export const FUEL_TYPES = [
  'GASOLINE_COMMON',
  'GASOLINE_ADDITIVE',
  'GASOLINE_PREMIUM',
  'ETHANOL',
  'DIESEL',
  'GNV'
] as const

export type FuelType = (typeof FUEL_TYPES)[number]

export type VehicleStatus = 'ACTIVE' | 'INACTIVE'

export interface Vehicle {
  id: string
  name: string
  brand: string
  model: string
  modelYear: number
  manufactureYear: number | null
  licensePlate: string | null
  color: string | null
  currentOdometerKm: number
  initialOdometerKm: number
  fuelTankCapacityLiters: number | null
  defaultFuelType: FuelType
  photoUrl: string | null
  isActive: boolean
  notes: string | null
  createdAt: string
  updatedAt: string
}

export interface CreateVehicleDTO {
  name: string
  brand: string
  model: string
  modelYear: number
  manufactureYear?: number | null
  licensePlate?: string | null
  color?: string | null
  initialOdometerKm: number
  currentOdometerKm?: number
  fuelTankCapacityLiters?: number | null
  defaultFuelType?: FuelType
  notes?: string | null
}

export type UpdateVehicleDTO = Partial<CreateVehicleDTO> & {
  isActive?: boolean
}

export interface ListVehiclesParams {
  status?: VehicleStatus
}

export interface MutationResponse {
  message: string
}

export interface CreateResponse extends MutationResponse {
  id: string
}
