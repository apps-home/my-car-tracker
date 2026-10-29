import { Injectable, Logger } from '@nestjs/common'

import { DomainNotifier } from '@/core/domain/notifications/domain-notifier.interface'
import { NOTIFICATION_WORKFLOWS } from '@/core/domain/notifications/notification.constants'
import {
  DomainWebhook,
  WEBHOOKS
} from '@/core/domain/webhooks/domain-webhook.interface'
import { UserRepository } from '@/modules/user/domain/user.repository'
import type { Vehicle } from '@/modules/vehicles/domain/vehicle.entity'

import type {
  EvaluationResult,
  MaintenanceSchedule
} from '../../domain/schedule.entity'
import { ScheduleRepository } from '../../domain/schedule.repository'
import { describeDue } from '../../domain/schedule-message'

export interface MaintenanceDuePayload extends Record<string, unknown> {
  scheduleId: string
  vehicleId: string
  vehicleName: string
  title: string
  status: 'DUE_SOON' | 'OVERDUE'
  message: string
  daysRemaining: number | null
  kmRemaining: number | null
  /** YYYY-MM-DD */
  nextDueDate: string | null
  nextDueOdometerKm: number | null
}

export interface AlertRunSummary {
  evaluated: number
  changed: number
  notified: number
}

/**
 * Reavalia planos e avisa (Novu in-app + webhook do n8n) só quando o status
 * piora: ON_TRACK → DUE_SOON → OVERDUE. O status gravado evita aviso repetido.
 */
@Injectable()
export class ScheduleAlertService {
  private readonly logger = new Logger(ScheduleAlertService.name)

  constructor(
    private scheduleRepository: ScheduleRepository,
    private userRepository: UserRepository,
    private notifier: DomainNotifier,
    private webhook: DomainWebhook
  ) {}

  async evaluate(
    schedules: MaintenanceSchedule[],
    vehicles: Vehicle[],
    today: Date
  ): Promise<AlertRunSummary> {
    const vehiclesById = new Map(
      vehicles.map((vehicle) => [vehicle.id, vehicle])
    )
    const toSave: MaintenanceSchedule[] = []
    let notified = 0

    for (const schedule of schedules) {
      const vehicle = vehiclesById.get(schedule.vehicleId)

      // Veículo vendido não gera alerta
      if (!vehicle?.isActive || !schedule.isActive) continue

      const result = schedule.evaluate(vehicle.currentOdometerKm, today)

      if (result.worsened && (await this.notify(schedule, vehicle, result))) {
        schedule.markNotified()
        notified++
      }

      if (result.changed) {
        toSave.push(schedule)
      }
    }

    await this.scheduleRepository.saveMany(toSave)

    return { evaluated: schedules.length, changed: toSave.length, notified }
  }

  private async notify(
    schedule: MaintenanceSchedule,
    vehicle: Vehicle,
    result: EvaluationResult
  ): Promise<boolean> {
    const status = result.status as MaintenanceDuePayload['status']
    const nextDueDate = schedule.nextDueDate?.toISOString().slice(0, 10) ?? null
    const payload: MaintenanceDuePayload = {
      scheduleId: schedule.id,
      vehicleId: vehicle.id,
      vehicleName: vehicle.name,
      title: schedule.title,
      status,
      message: `${schedule.title} (${vehicle.name}): ${describeDue(result)}`,
      daysRemaining: result.daysRemaining,
      kmRemaining: result.kmRemaining,
      nextDueDate,
      nextDueOdometerKm: schedule.nextDueOdometerKm
    }

    try {
      const user = await this.userRepository.findById(schedule.userId)

      const [inApp, webhook] = await Promise.all([
        this.notifier.send({
          workflow: NOTIFICATION_WORKFLOWS.MAINTENANCE_DUE,
          to: {
            subscriberId: schedule.userId,
            email: user?.email,
            name: user?.name
          },
          payload,
          // Mesmo vencimento e status: o Novu descarta o envio repetido
          transactionId: [
            'maintenance-due',
            schedule.id,
            status,
            nextDueDate ?? '',
            schedule.nextDueOdometerKm ?? ''
          ].join(':')
        }),
        this.webhook.trigger(WEBHOOKS.MAINTENANCE_DUE, {
          ...payload,
          user: user
            ? { id: user.id, name: user.name, email: user.email }
            : null
        })
      ])

      return inApp === 'sent' || webhook
    } catch (error) {
      this.logger.error(
        `Failed to notify schedule ${schedule.id}`,
        error instanceof Error ? error.stack : error
      )
      return false
    }
  }
}
