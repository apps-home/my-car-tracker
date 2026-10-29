import { PartialType } from '@nestjs/mapped-types'
import {
  IsBoolean,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  Min
} from 'class-validator'

import {
  VEHICLE_STATUSES,
  type VehicleStatus
} from '../domain/dto/vehicle.payload'
import { FUEL_TYPES, type FuelType } from '../domain/fuel-type'

export class CreateVehicleDTO {
  @IsString()
  @IsNotEmpty()
  @MaxLength(80)
  name: string

  @IsString()
  @IsNotEmpty()
  @MaxLength(80)
  brand: string

  @IsString()
  @IsNotEmpty()
  @MaxLength(80)
  model: string

  @IsInt()
  modelYear: number

  @IsOptional()
  @IsInt()
  manufactureYear?: number | null

  @IsOptional()
  @IsString()
  @MaxLength(10)
  licensePlate?: string | null

  @IsOptional()
  @IsString()
  @MaxLength(40)
  color?: string | null

  @IsInt()
  @Min(0)
  initialOdometerKm: number

  @IsOptional()
  @IsInt()
  @Min(0)
  currentOdometerKm?: number

  @IsOptional()
  @IsInt()
  @Min(1)
  fuelTankCapacityLiters?: number | null

  @IsOptional()
  @IsIn(FUEL_TYPES)
  defaultFuelType?: FuelType

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string | null
}

export class UpdateVehicleDTO extends PartialType(CreateVehicleDTO) {
  @IsOptional()
  @IsBoolean()
  isActive?: boolean
}

export class ListVehiclesQueryDTO {
  @IsOptional()
  @IsIn(VEHICLE_STATUSES)
  status?: VehicleStatus
}
