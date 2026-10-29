import { addDaysUtc, startOfDayUtc } from './utc-date'

export interface PeriodFilter {
  from?: Date
  /** Inclusivo (o dia inteiro) */
  to?: Date
  year?: number
  /** 1-12, só vale junto com `year` */
  month?: number
}

/** Intervalo semiaberto [gte, lt) em UTC */
export interface DateRange {
  gte?: Date
  lt?: Date
}

/** Converte os filtros de período na interseção dos intervalos informados */
export function toDateRange({
  from,
  to,
  year,
  month
}: PeriodFilter): DateRange {
  const starts: Date[] = []
  const ends: Date[] = []

  if (year !== undefined) {
    starts.push(new Date(Date.UTC(year, month ? month - 1 : 0, 1)))
    ends.push(
      month
        ? new Date(Date.UTC(year, month, 1))
        : new Date(Date.UTC(year + 1, 0, 1))
    )
  }

  if (from) {
    starts.push(startOfDayUtc(from))
  }

  if (to) {
    ends.push(addDaysUtc(startOfDayUtc(to), 1))
  }

  return {
    gte: starts.length
      ? new Date(Math.max(...starts.map((date) => date.getTime())))
      : undefined,
    lt: ends.length
      ? new Date(Math.min(...ends.map((date) => date.getTime())))
      : undefined
  }
}

export function isInDateRange(date: Date, { gte, lt }: DateRange): boolean {
  return (!gte || date >= gte) && (!lt || date < lt)
}
