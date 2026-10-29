import { OmitType, PartialType } from '@nestjs/mapped-types'
import { Type } from 'class-transformer'
import {
  IsDate,
  IsIn,
  IsInt,
  IsNotEmpty,
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

import {
  EXPENSE_CATEGORIES,
  type ExpenseCategory
} from '../domain/expense-category'

export class CreateExpenseDTO {
  @IsUUID('4')
  vehicleId: string

  @IsIn(EXPENSE_CATEGORIES)
  category: ExpenseCategory

  /** Dia da despesa (`YYYY-MM-DD`) */
  @Type(() => Date)
  @IsDate()
  date: Date

  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  amount: number

  @IsString()
  @IsNotEmpty()
  @MaxLength(160)
  description: string

  @IsOptional()
  @IsString()
  @MaxLength(160)
  locationOrRoute?: string | null

  @IsOptional()
  @IsInt()
  @Min(0)
  odometerKm?: number | null

  @IsOptional()
  @IsIn(PAYMENT_METHODS)
  paymentMethod?: PaymentMethod | null

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string | null
}

export class UpdateExpenseDTO extends PartialType(
  OmitType(CreateExpenseDTO, ['vehicleId'] as const)
) {}

export class ListExpensesQueryDTO extends PeriodQueryDTO {
  @IsOptional()
  @IsUUID('4')
  vehicleId?: string

  @IsOptional()
  @IsIn(EXPENSE_CATEGORIES)
  category?: ExpenseCategory

  @IsOptional()
  @IsString()
  @MaxLength(100)
  search?: string
}

export class ExpenseSuggestionsQueryDTO {
  @IsUUID('4')
  vehicleId: string

  @IsOptional()
  @IsIn(EXPENSE_CATEGORIES)
  category?: ExpenseCategory
}
