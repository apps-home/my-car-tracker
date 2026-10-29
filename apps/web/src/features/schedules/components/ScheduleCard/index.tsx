'use client'

import { Button } from '@lib/ui/components/button'
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from '@lib/ui/components/card'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@lib/ui/components/dropdown-menu'
import { cn } from '@lib/ui/lib/utils'
import {
  CalendarClock,
  Gauge,
  MoreVertical,
  Pause,
  Pencil,
  Play,
  Trash2,
  Wrench
} from 'lucide-react'

import { formatDate } from '@/shared/utils/format-date'

import type { Schedule, ScheduleAlertStatus } from '../../api/types'
import { describeDue, describeInterval } from '../../utils/schedule-labels'
import { ScheduleStatusBadge } from '../ScheduleStatusBadge'

const BAR_COLORS: Record<ScheduleAlertStatus, string> = {
  ON_TRACK: 'bg-primary',
  DUE_SOON: 'bg-chart-4',
  OVERDUE: 'bg-destructive'
}

const DAY_MS = 24 * 60 * 60 * 1000

function ProgressRow({
  icon: Icon,
  label,
  detail,
  percent,
  status
}: {
  icon: typeof Gauge
  label: string
  detail: string
  percent: number
  status: ScheduleAlertStatus
}) {
  const clamped = Math.min(100, Math.max(0, percent))

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between gap-2 text-xs">
        <span className="flex items-center gap-1.5">
          <Icon className="size-3.5 text-muted-foreground" />
          {label}
        </span>
        <span className="text-[11px] text-muted-foreground">{detail}</span>
      </div>
      <div
        className="h-2 overflow-hidden rounded-full bg-muted"
        role="progressbar"
        aria-label={label}
        aria-valuenow={Math.round(clamped)}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div
          className={cn(
            'h-full rounded-full transition-all',
            BAR_COLORS[status]
          )}
          style={{ width: `${clamped}%` }}
        />
      </div>
    </div>
  )
}

function timeProgress(schedule: Schedule) {
  if (
    !schedule.intervalMonths ||
    !schedule.lastExecutedAt ||
    !schedule.nextDueDate ||
    schedule.daysRemaining === null
  ) {
    return null
  }

  const totalDays =
    (new Date(schedule.nextDueDate).getTime() -
      new Date(schedule.lastExecutedAt).getTime()) /
    DAY_MS
  const elapsedDays = totalDays - schedule.daysRemaining
  const percent = totalDays > 0 ? (elapsedDays / totalDays) * 100 : 100
  const elapsedMonths = Math.max(
    0,
    Math.floor((elapsedDays / totalDays) * schedule.intervalMonths)
  )

  return {
    percent,
    label: `${elapsedMonths.toLocaleString('pt-BR')} de ${schedule.intervalMonths} meses`,
    detail: `Vence em ${formatDate(schedule.nextDueDate)}`,
    status: (schedule.daysRemaining < 0
      ? 'OVERDUE'
      : schedule.daysRemaining <= schedule.alertDaysBefore
        ? 'DUE_SOON'
        : 'ON_TRACK') as ScheduleAlertStatus
  }
}

function kmProgress(schedule: Schedule) {
  if (
    !schedule.intervalKm ||
    schedule.kmRemaining === null ||
    schedule.nextDueOdometerKm === null
  ) {
    return null
  }

  const driven = schedule.intervalKm - schedule.kmRemaining

  return {
    percent: (driven / schedule.intervalKm) * 100,
    label: `${Math.max(0, driven).toLocaleString('pt-BR')} de ${schedule.intervalKm.toLocaleString('pt-BR')} km`,
    detail: `Vence aos ${schedule.nextDueOdometerKm.toLocaleString('pt-BR')} km`,
    status: (schedule.kmRemaining <= 0
      ? 'OVERDUE'
      : schedule.kmRemaining <= schedule.alertKmBefore
        ? 'DUE_SOON'
        : 'ON_TRACK') as ScheduleAlertStatus
  }
}

interface ScheduleCardProps {
  schedule: Schedule
  onRegister: () => void
  onEdit: () => void
  onToggleActive: () => void
  onDelete: () => void
}

export function ScheduleCard({
  schedule,
  onRegister,
  onEdit,
  onToggleActive,
  onDelete
}: ScheduleCardProps) {
  const time = timeProgress(schedule)
  const km = kmProgress(schedule)

  return (
    <Card
      data-slot="schedule-card"
      className={cn(!schedule.isActive && 'opacity-60')}
    >
      <CardHeader>
        <CardTitle className="leading-snug">{schedule.title}</CardTitle>
        <CardDescription className="flex flex-wrap items-center gap-2">
          <ScheduleStatusBadge status={schedule.alertStatus} />
          <span>
            {schedule.isActive
              ? describeDue(schedule)
              : 'Pausado (não gera alertas)'}
          </span>
        </CardDescription>
        <CardAction>
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button variant="ghost" size="icon-sm" aria-label="Ações" />
              }
            >
              <MoreVertical />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40 p-1">
              <DropdownMenuItem onClick={onEdit} className="gap-2 py-2">
                <Pencil /> Editar
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onToggleActive} className="gap-2 py-2">
                {schedule.isActive ? (
                  <>
                    <Pause /> Pausar
                  </>
                ) : (
                  <>
                    <Play /> Reativar
                  </>
                )}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={onDelete}
                className="gap-2 py-2 text-destructive"
              >
                <Trash2 /> Excluir
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </CardAction>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-[11px] text-muted-foreground">
          A cada {describeInterval(schedule)}
          {schedule.lastExecutedAt &&
            ` · última: ${formatDate(schedule.lastExecutedAt)}`}
          {schedule.lastExecutedOdometerKm !== null &&
            ` aos ${schedule.lastExecutedOdometerKm.toLocaleString('pt-BR')} km`}
        </p>
        {time && <ProgressRow icon={CalendarClock} {...time} />}
        {km && <ProgressRow icon={Gauge} {...km} />}
      </CardContent>
      <CardFooter>
        <Button
          variant={schedule.alertStatus === 'ON_TRACK' ? 'outline' : 'default'}
          size="sm"
          className="w-full"
          onClick={onRegister}
        >
          <Wrench /> Registrar execução
        </Button>
      </CardFooter>
    </Card>
  )
}
