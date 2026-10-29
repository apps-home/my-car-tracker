import type { PaymentMethod } from '@/core/domain/payment-method'
import type { PeriodFilter } from '@/core/utils/date-range'
import type { FuelType } from '@/modules/vehicles/domain/fuel-type'

export interface CreateFuelLogPayload {
  vehicleId: string
  date: Date
  odometerKm: number
  fuelType: FuelType
  liters: number
  pricePerLiter: number
  /** Sem valor, é `liters * pricePerLiter` */
  totalCost?: number
  isFullTank?: boolean
  gasStationName?: string | null
  paymentMethod?: PaymentMethod | null
  notes?: string | null
}

export type UpdateFuelLogPayload = Partial<
  Omit<CreateFuelLogPayload, 'vehicleId'>
>

export interface ListFuelLogsParams extends PeriodFilter {
  userId: string
  vehicleId?: string
  fuelType?: FuelType
}

export interface FuelLogSummaryParams extends PeriodFilter {
  userId: string
  vehicleId: string
}
