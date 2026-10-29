import { OmitType, PartialType } from '@nestjs/mapped-types'
import { Transform, Type } from 'class-transformer'
import {
  ArrayUnique,
  IsArray,
  IsBoolean,
  IsDate,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min
} from 'class-validator'

import {
  SCHEDULE_ALERT_STATUSES,
  SCHEDULE_TRIGGER_RULES,
  type ScheduleAlertStatus,
  type ScheduleTriggerRule
} from '../domain/schedule-types'

export class CreateScheduleDTO {
  @IsUUID('4')
  vehicleId: string

  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  title: string

  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string | null

  @IsOptional()
  @IsIn(SCHEDULE_TRIGGER_RULES)
  triggerRule?: ScheduleTriggerRule

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(240)
  intervalMonths?: number | null

  @IsOptional()
  @IsInt()
  @Min(1)
  intervalKm?: number | null

  /** Dia da última execução (`YYYY-MM-DD`); sem valor, hoje */
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  lastExecutedAt?: Date | null

  @IsOptional()
  @IsInt()
  @Min(0)
  lastExecutedOdometerKm?: number | null

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(365)
  alertDaysBefore?: number

  @IsOptional()
  @IsInt()
  @Min(0)
  alertKmBefore?: number
}

export class UpdateScheduleDTO extends PartialType(
  OmitType(CreateScheduleDTO, ['vehicleId'] as const)
) {
  @IsOptional()
  @IsBoolean()
  isActive?: boolean
}

export class ListSchedulesQueryDTO {
  @IsOptional()
  @IsUUID('4')
  vehicleId?: string

  @IsOptional()
  @IsIn(SCHEDULE_ALERT_STATUSES)
  alertStatus?: ScheduleAlertStatus

  @IsOptional()
  @Transform(({ value }) => value === true || value === 'true')
  @IsBoolean()
  includeInactive?: boolean
}

export class SeedDefaultSchedulesDTO {
  @IsUUID('4')
  vehicleId: string

  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @IsString({ each: true })
  templates?: string[]
}
