import { buttonVariants } from '@lib/ui/components/button'
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@lib/ui/components/card'
import { CalendarCheck } from 'lucide-react'
import Link from 'next/link'

import type { Schedule } from '@/features/schedules/api/types'
import { ScheduleStatusBadge } from '@/features/schedules/components/ScheduleStatusBadge'
import { describeDue } from '@/features/schedules/utils/schedule-labels'

interface MaintenanceAlertsCardProps {
  schedules: Schedule[]
  limit?: number
}

/** Planos vencidos ou próximos do vencimento (a API já ordena pelo mais urgente) */
export function MaintenanceAlertsCard({
  schedules,
  limit = 5
}: MaintenanceAlertsCardProps) {
  const alerts = schedules.filter(
    (schedule) => schedule.isActive && schedule.alertStatus !== 'ON_TRACK'
  )

  return (
    <Card data-slot="maintenance-alerts-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CalendarCheck className="size-4 text-primary" />
          Manutenções preventivas
        </CardTitle>
        <CardDescription>
          {schedules.length === 0
            ? 'Nenhum plano ativo'
            : alerts.length === 0
              ? 'Tudo em dia'
              : `${alerts.length} precisando de atenção`}
        </CardDescription>
        <CardAction>
          <Link
            href="/schedules"
            className={buttonVariants({ variant: 'ghost', size: 'sm' })}
          >
            Ver planos
          </Link>
        </CardAction>
      </CardHeader>
      {alerts.length > 0 && (
        <CardContent>
          <ul className="divide-y text-xs">
            {alerts.slice(0, limit).map((schedule) => (
              <li key={schedule.id} className="flex items-center gap-3 py-2">
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{schedule.title}</p>
                  <p className="text-[11px] text-muted-foreground">
                    {describeDue(schedule)}
                  </p>
                </div>
                <ScheduleStatusBadge status={schedule.alertStatus} />
              </li>
            ))}
          </ul>
        </CardContent>
      )}
      {schedules.length === 0 && (
        <CardContent>
          <Link
            href="/schedules"
            className={buttonVariants({ variant: 'outline', size: 'sm' })}
          >
            Ativar planos sugeridos
          </Link>
        </CardContent>
      )}
    </Card>
  )
}
