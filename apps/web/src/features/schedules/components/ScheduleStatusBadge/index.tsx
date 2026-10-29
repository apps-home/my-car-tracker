import { Badge } from '@lib/ui/components/badge'
import { AlertTriangle, CheckCircle2, Clock } from 'lucide-react'

import type { ScheduleAlertStatus } from '../../api/types'
import { ALERT_STATUS_LABELS } from '../../utils/schedule-labels'

const VARIANTS = {
  ON_TRACK: { variant: 'secondary', icon: CheckCircle2 },
  DUE_SOON: { variant: 'outline', icon: Clock },
  OVERDUE: { variant: 'destructive', icon: AlertTriangle }
} as const

/** Status sempre com ícone e texto, nunca só pela cor */
export function ScheduleStatusBadge({
  status
}: {
  status: ScheduleAlertStatus
}) {
  const { variant, icon: Icon } = VARIANTS[status]

  return (
    <Badge data-slot="schedule-status-badge" variant={variant}>
      <Icon />
      {ALERT_STATUS_LABELS[status]}
    </Badge>
  )
}
