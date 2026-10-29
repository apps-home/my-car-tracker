export const DAY_MS = 24 * 60 * 60 * 1000

/** Dia de calendário (00:00 UTC) */
export function startOfDayUtc(date: Date): Date {
  return new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate())
  )
}

export function addDaysUtc(date: Date, days: number): Date {
  return new Date(date.getTime() + days * DAY_MS)
}

/** Dia 1º do mês (00:00 UTC), com `months` meses de deslocamento */
export function firstOfMonthUtc(date: Date, months = 0): Date {
  return new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + months, 1)
  )
}

export function daysInMonthUtc(date: Date): number {
  return new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0)
  ).getUTCDate()
}

/**
 * Soma meses mantendo o dia; se o mês de destino for mais curto, usa o último
 * dia dele (31/01 + 1 mês = 28/02 ou 29/02)
 */
export function addMonthsUtc(date: Date, months: number): Date {
  const target = new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + months, 1)
  )
  const day = Math.min(date.getUTCDate(), daysInMonthUtc(target))

  return new Date(Date.UTC(target.getUTCFullYear(), target.getUTCMonth(), day))
}

/** Diferença em dias de calendário (UTC) entre `a` e `b` (a - b) */
export function differenceInCalendarDaysUtc(a: Date, b: Date): number {
  return Math.round(
    (startOfDayUtc(a).getTime() - startOfDayUtc(b).getTime()) / DAY_MS
  )
}

/** Fuso do usuário: o "hoje" dos vencimentos e o horário do cron */
export const APP_TIME_ZONE = 'America/Sao_Paulo'

/** Dia de calendário de `now` no fuso informado, como 00:00 UTC */
export function todayInTimeZone(
  timeZone = APP_TIME_ZONE,
  now: Date = new Date()
): Date {
  const [year, month, day] = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  })
    .format(now)
    .split('-')
    .map(Number)

  return new Date(Date.UTC(year, month - 1, day))
}
