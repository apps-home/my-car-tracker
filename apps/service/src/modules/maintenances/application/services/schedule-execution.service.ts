import { Injectable } from '@nestjs/common'

import { PayloadError } from '@/core/domain/errors/payload-error'
import { todayInTimeZone } from '@/core/utils/utc-date'
import { ScheduleAlertService } from '@/modules/schedules/application/services/schedule-alert.service'
import type { MaintenanceSchedule } from '@/modules/schedules/domain/schedule.entity'
import { ScheduleRepository } from '@/modules/schedules/domain/schedule.repository'
import type { Vehicle } from '@/modules/vehicles/domain/vehicle.entity'

import type {
  Maintenance,
  MaintenanceExecution
} from '../../domain/maintenance.entity'
import { MaintenanceRepository } from '../../domain/maintenance.repository'

export interface PreviousExecution extends MaintenanceExecution {
  scheduleIds: string[]
}

interface SyncRequest {
  userId: string
  vehicle: Vehicle
  /** Estado gravado da manutenção (`null` quando foi excluída) */
  current: Maintenance | null
  /** Estado antes da edição/exclusão */
  previous?: PreviousExecution
}

function sameExecution(
  schedule: MaintenanceSchedule,
  execution: MaintenanceExecution
) {
  return (
    schedule.lastExecutedAt?.getTime() === execution.date.getTime() &&
    schedule.lastExecutedOdometerKm === execution.odometerKm
  )
}

/**
 * Mantém a última execução dos planos em dia com as manutenções:
 * - nova manutenção que cumpre um plano renova o ciclo (se for a mais recente);
 * - editar ou excluir a manutenção que deu origem ao ciclo recalcula a partir da
 *   manutenção vinculada mais recente que sobrou.
 * Depois reavalia o status (e avisa se piorou).
 */
@Injectable()
export class ScheduleExecutionService {
  constructor(
    private scheduleRepository: ScheduleRepository,
    private maintenanceRepository: MaintenanceRepository,
    private scheduleAlertService: ScheduleAlertService
  ) {}

  /** Os planos vinculados precisam existir e ser do mesmo veículo */
  async validate(
    userId: string,
    vehicleId: string,
    scheduleIds: string[]
  ): Promise<PayloadError | null> {
    if (!scheduleIds.length) return null

    const schedules = await this.scheduleRepository.findManyByIds(
      scheduleIds,
      userId
    )
    const valid = new Set(
      schedules
        .filter((schedule) => schedule.vehicleId === vehicleId)
        .map((schedule) => schedule.id)
    )
    const invalid = scheduleIds.filter((id) => !valid.has(id))

    return invalid.length
      ? new PayloadError(
          `scheduleId not found for this vehicle: ${invalid.join(', ')}`
        )
      : null
  }

  async sync({ userId, vehicle, current, previous }: SyncRequest) {
    const affected = [
      ...new Set([
        ...(current?.scheduleIds ?? []),
        ...(previous?.scheduleIds ?? [])
      ])
    ]

    if (!affected.length) return

    const schedules = (
      await this.scheduleRepository.findManyByIds(affected, userId)
    ).filter((schedule) => schedule.vehicleId === vehicle.id)
    const changed: MaintenanceSchedule[] = []

    for (const schedule of schedules) {
      let updated = false

      if (previous && sameExecution(schedule, previous)) {
        const latest =
          await this.maintenanceRepository.findLatestExecutionForSchedule(
            schedule.id,
            userId
          )

        if (latest) {
          updated = schedule.registerExecution(
            latest.date,
            latest.odometerKm,
            true
          )
        }
      } else if (current?.scheduleIds.includes(schedule.id)) {
        updated = schedule.registerExecution(current.date, current.odometerKm)
      }

      if (updated) changed.push(schedule)
    }

    await this.scheduleRepository.saveMany(changed)
    await this.scheduleAlertService.evaluate(
      schedules,
      [vehicle],
      todayInTimeZone()
    )
  }
}
