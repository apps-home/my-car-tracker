import type { ScheduleAlertStatus, ScheduleTriggerRule } from '../api/types'

export const TRIGGER_RULE_LABELS: Record<ScheduleTriggerRule, string> = {
  WHICHEVER_COMES_FIRST: 'Tempo ou km (o que vencer primeiro)',
  TIME_ONLY: 'Só tempo',
  ODOMETER_ONLY: 'Só quilometragem'
}

export const ALERT_STATUS_LABELS: Record<ScheduleAlertStatus, string> = {
  ON_TRACK: 'Em dia',
  DUE_SOON: 'Próximo',
  OVERDUE: 'Vencido'
}

function plural(value: number, singular: string, pluralForm: string) {
  return `${value.toLocaleString('pt-BR')} ${value === 1 ? singular : pluralForm}`
}

/** "Faltam 18 dias ou 420 km", "Vencido há 12 dias", "Vence hoje" */
export function describeDue({
  alertStatus,
  daysRemaining,
  kmRemaining
}: {
  alertStatus: ScheduleAlertStatus
  daysRemaining: number | null
  kmRemaining: number | null
}): string {
  if (alertStatus === 'OVERDUE') {
    if (daysRemaining !== null && daysRemaining < 0) {
      return `Vencido há ${plural(-daysRemaining, 'dia', 'dias')}`
    }

    if (kmRemaining !== null && kmRemaining <= 0) {
      return kmRemaining === 0
        ? 'Vencido por km'
        : `Vencido por km (passou ${plural(-kmRemaining, 'km', 'km')})`
    }
  }

  if (daysRemaining === 0) return 'Vence hoje'

  const parts = [
    daysRemaining !== null && plural(daysRemaining, 'dia', 'dias'),
    kmRemaining !== null && plural(kmRemaining, 'km', 'km')
  ].filter(Boolean)

  return `Faltam ${parts.join(' ou ')}`
}

export function describeInterval({
  intervalMonths,
  intervalKm
}: {
  intervalMonths: number | null
  intervalKm: number | null
}) {
  return [
    intervalMonths &&
      (intervalMonths % 12 === 0
        ? plural(intervalMonths / 12, 'ano', 'anos')
        : plural(intervalMonths, 'mês', 'meses')),
    intervalKm && plural(intervalKm, 'km', 'km')
  ]
    .filter(Boolean)
    .join(' ou ')
}
