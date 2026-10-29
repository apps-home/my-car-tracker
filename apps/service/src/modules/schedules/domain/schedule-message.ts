import type { ScheduleEvaluation } from './schedule-calculator'

function plural(value: number, singular: string, pluralForm: string) {
  return `${value.toLocaleString('pt-BR')} ${value === 1 ? singular : pluralForm}`
}

/**
 * Texto curto do vencimento, como no painel:
 * "Faltam 18 dias ou 420 km", "Vencido há 12 dias", "Vencido por km (passou 300 km)"
 */
export function describeDue({
  status,
  daysRemaining,
  kmRemaining
}: ScheduleEvaluation): string {
  if (status === 'OVERDUE') {
    if (daysRemaining !== null && daysRemaining < 0) {
      return `Vencido há ${plural(-daysRemaining, 'dia', 'dias')}`
    }

    if (kmRemaining !== null && kmRemaining <= 0) {
      return kmRemaining === 0
        ? 'Vencido por km'
        : `Vencido por km (passou ${plural(-kmRemaining, 'km', 'km')})`
    }
  }

  const parts: string[] = []

  if (daysRemaining !== null) {
    parts.push(
      daysRemaining === 0 ? 'vence hoje' : plural(daysRemaining, 'dia', 'dias')
    )
  }

  if (kmRemaining !== null) {
    parts.push(plural(kmRemaining, 'km', 'km'))
  }

  const text = parts.join(' ou ')

  return text.startsWith('vence') ? `V${text.slice(1)}` : `Faltam ${text}`
}
