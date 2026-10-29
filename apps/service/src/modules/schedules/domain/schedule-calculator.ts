import {
  addMonthsUtc,
  differenceInCalendarDaysUtc
} from '@/core/utils/utc-date'

import {
  ALERT_SEVERITY,
  type ScheduleAlertStatus,
  type ScheduleTriggerRule
} from './schedule-types'

export interface ScheduleRule {
  triggerRule: ScheduleTriggerRule
  intervalMonths: number | null
  intervalKm: number | null
}

export interface ScheduleState extends ScheduleRule {
  nextDueDate: Date | null
  nextDueOdometerKm: number | null
  alertDaysBefore: number
  alertKmBefore: number
}

export interface ScheduleEvaluation {
  status: ScheduleAlertStatus
  /** Negativo = vencido há N dias; `null` quando o plano não usa tempo */
  daysRemaining: number | null
  /** Zero ou negativo = vencido; `null` quando o plano não usa km */
  kmRemaining: number | null
}

export function usesTime({ triggerRule }: Pick<ScheduleRule, 'triggerRule'>) {
  return triggerRule !== 'ODOMETER_ONLY'
}

export function usesOdometer({
  triggerRule
}: Pick<ScheduleRule, 'triggerRule'>) {
  return triggerRule !== 'TIME_ONLY'
}

/** Próximo vencimento a partir da última execução */
export function calculateNextDue(
  rule: ScheduleRule,
  lastExecutedAt: Date,
  lastExecutedOdometerKm: number
): Pick<ScheduleState, 'nextDueDate' | 'nextDueOdometerKm'> {
  return {
    nextDueDate:
      usesTime(rule) && rule.intervalMonths
        ? addMonthsUtc(lastExecutedAt, rule.intervalMonths)
        : null,
    nextDueOdometerKm:
      usesOdometer(rule) && rule.intervalKm
        ? lastExecutedOdometerKm + rule.intervalKm
        : null
  }
}

function timeStatus(daysRemaining: number, alertDaysBefore: number) {
  if (daysRemaining < 0) return 'OVERDUE'
  if (daysRemaining <= alertDaysBefore) return 'DUE_SOON'
  return 'ON_TRACK'
}

function kmStatus(kmRemaining: number, alertKmBefore: number) {
  if (kmRemaining <= 0) return 'OVERDUE'
  if (kmRemaining <= alertKmBefore) return 'DUE_SOON'
  return 'ON_TRACK'
}

/**
 * Status do plano hoje: por tempo (vencido com dias < 0; próximo dentro da
 * antecedência), por km (vencido com km restante <= 0) e, quando os dois
 * valem, o mais crítico.
 */
export function evaluateSchedule(
  schedule: ScheduleState,
  currentOdometerKm: number,
  today: Date
): ScheduleEvaluation {
  const daysRemaining =
    usesTime(schedule) && schedule.nextDueDate
      ? differenceInCalendarDaysUtc(schedule.nextDueDate, today)
      : null
  const kmRemaining =
    usesOdometer(schedule) && schedule.nextDueOdometerKm !== null
      ? schedule.nextDueOdometerKm - currentOdometerKm
      : null

  const statuses: ScheduleAlertStatus[] = []

  if (daysRemaining !== null) {
    statuses.push(timeStatus(daysRemaining, schedule.alertDaysBefore))
  }

  if (kmRemaining !== null) {
    statuses.push(kmStatus(kmRemaining, schedule.alertKmBefore))
  }

  const status = statuses.reduce<ScheduleAlertStatus>(
    (worst, current) =>
      ALERT_SEVERITY[current] > ALERT_SEVERITY[worst] ? current : worst,
    'ON_TRACK'
  )

  return { status, daysRemaining, kmRemaining }
}
