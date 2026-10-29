import { OmitType, PartialType } from '@nestjs/mapped-types'
import { Type } from 'class-transformer'
import {
  IsBoolean,
  IsDate,
  IsIn,
  IsInt,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  IsUUID,
  MaxLength,
  Min
} from 'class-validator'

import {
  PAYMENT_METHODS,
  type PaymentMethod
} from '@/core/domain/payment-method'
import { PeriodQueryDTO } from '@/infra/http/period-query.dto'
import { FUEL_TYPES, type FuelType } from '@/modules/vehicles/domain/fuel-type'

export class CreateFuelLogDTO {
  @IsUUID('4')
  vehicleId: string

  /** Dia do abastecimento (`YYYY-MM-DD`) */
  @Type(() => Date)
  @IsDate()
  date: Date

  @IsInt()
  @Min(0)
  odometerKm: number

  @IsIn(FUEL_TYPES)
  fuelType: FuelType

  @IsNumber({ maxDecimalPlaces: 3 })
  @IsPositive()
  liters: number

  @IsNumber({ maxDecimalPlaces: 3 })
  @IsPositive()
  pricePerLiter: number

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  totalCost?: number

  @IsOptional()
  @IsBoolean()
  isFullTank?: boolean

  @IsOptional()
  @IsString()
  @MaxLength(120)
  gasStationName?: string | null

  @IsOptional()
  @IsIn(PAYMENT_METHODS)
  paymentMethod?: PaymentMethod | null

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string | null
}

export class UpdateFuelLogDTO extends PartialType(
  OmitType(CreateFuelLogDTO, ['vehicleId'] as const)
) {}

export class ListFuelLogsQueryDTO extends PeriodQueryDTO {
  @IsOptional()
  @IsUUID('4')
  vehicleId?: string

  @IsOptional()
  @IsIn(FUEL_TYPES)
  fuelType?: FuelType
}

export class FuelLogSummaryQueryDTO extends PeriodQueryDTO {
  @IsUUID('4')
  vehicleId: string
}
