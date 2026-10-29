import { OmitType, PartialType } from '@nestjs/mapped-types'
import { Type } from 'class-transformer'
import {
  ArrayMaxSize,
  IsArray,
  IsDate,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
  ValidateNested
} from 'class-validator'

import { PeriodQueryDTO } from '@/infra/http/period-query.dto'

import {
  MAINTENANCE_TYPES,
  type MaintenanceType
} from '../domain/maintenance-type'

export class MaintenanceItemDTO {
  @IsOptional()
  @IsUUID('4')
  scheduleId?: string | null

  @IsString()
  @IsNotEmpty()
  @MaxLength(160)
  name: string

  @IsOptional()
  @IsString()
  @MaxLength(80)
  brand?: string | null

  @IsOptional()
  @IsString()
  @MaxLength(80)
  partNumber?: string | null

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  quantity?: number

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  unitPrice: number

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  totalPrice?: number

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(240)
  warrantyMonths?: number | null
}

export class CreateMaintenanceDTO {
  @IsUUID('4')
  vehicleId: string

  @IsOptional()
  @IsIn(MAINTENANCE_TYPES)
  type?: MaintenanceType

  @IsString()
  @IsNotEmpty()
  @MaxLength(160)
  title: string

  /** Dia do serviço (`YYYY-MM-DD`) */
  @Type(() => Date)
  @IsDate()
  date: Date

  @IsInt()
  @Min(0)
  odometerKm: number

  @IsOptional()
  @IsString()
  @MaxLength(120)
  workshopName?: string | null

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  laborCost?: number

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  partsCost?: number

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  totalAmount?: number

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notes?: string | null

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(100)
  @ValidateNested({ each: true })
  @Type(() => MaintenanceItemDTO)
  items?: MaintenanceItemDTO[]
}

export class UpdateMaintenanceDTO extends PartialType(
  OmitType(CreateMaintenanceDTO, ['vehicleId'] as const)
) {}

export class ListMaintenancesQueryDTO extends PeriodQueryDTO {
  @IsOptional()
  @IsUUID('4')
  vehicleId?: string

  @IsOptional()
  @IsIn(MAINTENANCE_TYPES)
  type?: MaintenanceType

  @IsOptional()
  @IsString()
  @MaxLength(100)
  search?: string
}

export class ListWarrantiesQueryDTO {
  @IsOptional()
  @IsUUID('4')
  vehicleId?: string
}
