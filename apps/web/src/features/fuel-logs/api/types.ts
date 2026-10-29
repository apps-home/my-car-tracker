import type {
  CreateResponse,
  FuelType,
  MutationResponse
} from '@/features/vehicles/api/types'
import type { PaymentMethod } from '@/shared/utils/payment-methods'

export type { CreateResponse, MutationResponse }

export interface FuelLog {
  id: string
  vehicleId: string
  /** Dia do abastecimento (00:00 UTC) */
  date: string
  odometerKm: number
  fuelType: FuelType
  liters: number
  pricePerLiter: number
  totalCost: number
  isFullTank: boolean
  gasStationName: string | null
  paymentMethod: PaymentMethod | null
  distanceDrivenKm: number | null
  consumptionKmPerLiter: number | null
  costPerKm: number | null
  notes: string | null
  createdAt: string
  updatedAt: string
}

export interface CreateFuelLogDTO {
  vehicleId: string
  /** YYYY-MM-DD */
  date: string
  odometerKm: number
  fuelType: FuelType
  liters: number
  pricePerLiter: number
  totalCost?: number
  isFullTank?: boolean
  gasStationName?: string | null
  paymentMethod?: PaymentMethod | null
  notes?: string | null
}

export type UpdateFuelLogDTO = Partial<Omit<CreateFuelLogDTO, 'vehicleId'>>

export interface PeriodParams {
  year?: number
  month?: number
  /** YYYY-MM-DD */
  from?: string
  /** YYYY-MM-DD, inclusivo */
  to?: string
}

export interface ListFuelLogsParams extends PeriodParams {
  vehicleId?: string
  fuelType?: FuelType
}

export interface FuelLogSummaryParams extends PeriodParams {
  vehicleId: string
}

export interface FuelTotals {
  count: number
  totalLiters: number
  totalCost: number
  averagePricePerLiter: number | null
  distanceKm: number
  consumptionKmPerLiter: number | null
  costPerKm: number | null
}

export interface FuelTypeSummary extends FuelTotals {
  fuelType: FuelType
  lastPricePerLiter: number
}

export interface FuelLogSummary extends FuelTotals {
  vehicleId: string
  byFuelType: FuelTypeSummary[]
  /** km/L no etanol ÷ km/L na gasolina, com o histórico real do carro */
  ethanolParity: number | null
}
