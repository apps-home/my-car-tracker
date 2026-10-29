export const SCHEDULE_TRIGGER_RULES = [
  'TIME_ONLY',
  'ODOMETER_ONLY',
  'WHICHEVER_COMES_FIRST'
] as const

export type ScheduleTriggerRule = (typeof SCHEDULE_TRIGGER_RULES)[number]

export const SCHEDULE_ALERT_STATUSES = [
  'ON_TRACK',
  'DUE_SOON',
  'OVERDUE'
] as const

export type ScheduleAlertStatus = (typeof SCHEDULE_ALERT_STATUSES)[number]

/** Gravidade para consolidar tempo × km e saber se o status piorou */
export const ALERT_SEVERITY: Record<ScheduleAlertStatus, number> = {
  ON_TRACK: 0,
  DUE_SOON: 1,
  OVERDUE: 2
}
