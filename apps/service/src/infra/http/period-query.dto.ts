import { Type } from 'class-transformer'
import { IsDate, IsInt, IsOptional, Max, Min } from 'class-validator'

/** Filtros de período das listagens (`from`/`to` em `YYYY-MM-DD`, `to` inclusivo) */
export class PeriodQueryDTO {
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  from?: Date

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  to?: Date

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1900)
  @Max(3000)
  year?: number

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(12)
  month?: number
}
