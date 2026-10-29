import { randomUUID } from 'node:crypto'

import { PayloadError } from '@/core/domain/errors/payload-error'
import { omitUndefined } from '@/core/utils/omit-undefined'
import { addDaysUtc, startOfDayUtc } from '@/core/utils/utc-date'

import type { CreateSchedulePayload } from './dto/schedule.payload'
import {
  calculateNextDue,
  evaluateSchedule,
  type ScheduleEvaluation,
  usesOdometer,
  usesTime
} from './schedule-calculator'
import {
  ALERT_SEVERITY,
  type ScheduleAlertStatus,
  type ScheduleTriggerRule
} from './schedule-types'

export interface ScheduleProps {
  id: string
  vehicleId: string
  userId: string
  title: string
  description: string | null
  triggerRule: ScheduleTriggerRule
  intervalMonths: number | null
  intervalKm: number | null
  lastExecutedAt: Date | null
  lastExecutedOdometerKm: number | null
  nextDueDate: Date | null
  nextDueOdometerKm: number | null
  alertDaysBefore: number
  alertKmBefore: number
  alertStatus: ScheduleAlertStatus
  lastNotifiedAt: Date | null
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

type SystemField =
  | 'id'
  | 'vehicleId'
  | 'userId'
  | 'nextDueDate'
  | 'nextDueOdometerKm'
  | 'alertStatus'
  | 'lastNotifiedAt'
  | 'createdAt'
  | 'updatedAt'

export type UpdateScheduleProps = Partial<Omit<ScheduleProps, SystemField>>

export interface EvaluationResult extends ScheduleEvaluation {
  /** O status ficou mais crítico (ON_TRACK → DUE_SOON → OVERDUE): hora de avisar */
  worsened: boolean
  changed: boolean
}

export interface ScheduleStartingPoint {
  /** Dia de hoje e km atual do veículo, usados quando o usuário não informa a última execução */
  today: Date
  currentOdometerKm: number
}

export class MaintenanceSchedule {
  private _props: ScheduleProps

  constructor(props: ScheduleProps) {
    this._props = props
  }

  static create(
    userId: string,
    data: CreateSchedulePayload,
    start: ScheduleStartingPoint
  ): MaintenanceSchedule {
    const now = new Date()

    return new MaintenanceSchedule(
      MaintenanceSchedule.normalize({
        id: randomUUID(),
        vehicleId: data.vehicleId,
        userId,
        title: data.title,
        description: data.description ?? null,
        triggerRule: data.triggerRule ?? 'WHICHEVER_COMES_FIRST',
        intervalMonths: data.intervalMonths ?? null,
        intervalKm: data.intervalKm ?? null,
        lastExecutedAt: data.lastExecutedAt ?? start.today,
        lastExecutedOdometerKm:
          data.lastExecutedOdometerKm ?? start.currentOdometerKm,
        nextDueDate: null,
        nextDueOdometerKm: null,
        alertDaysBefore: data.alertDaysBefore ?? 30,
        alertKmBefore: data.alertKmBefore ?? 500,
        alertStatus: 'ON_TRACK',
        lastNotifiedAt: null,
        isActive: true,
        createdAt: now,
        updatedAt: now
      })
    )
  }

  update(data: UpdateScheduleProps): void {
    this._props = MaintenanceSchedule.normalize({
      ...this._props,
      ...omitUndefined(data),
      updatedAt: new Date()
    })
  }

  /**
   * Uma manutenção cumpriu o plano: o ciclo recomeça a partir dela.
   * Devolve `false` quando a execução é mais antiga que a já registrada.
   */
  registerExecution(date: Date, odometerKm: number, force = false): boolean {
    const executedAt = startOfDayUtc(date)

    if (
      !force &&
      this._props.lastExecutedAt &&
      executedAt < this._props.lastExecutedAt
    ) {
      return false
    }

    this.update({
      lastExecutedAt: executedAt,
      lastExecutedOdometerKm: odometerKm
    })

    return true
  }

  /** Avalia o status com o km atual do veículo e o dia de hoje (fuso do usuário) */
  evaluate(currentOdometerKm: number, today: Date): EvaluationResult {
    const evaluation = evaluateSchedule(this._props, currentOdometerKm, today)
    const previous = this._props.alertStatus
    const changed = evaluation.status !== previous

    if (changed) {
      this._props = {
        ...this._props,
        alertStatus: evaluation.status,
        updatedAt: new Date()
      }
    }

    return {
      ...evaluation,
      changed,
      worsened: ALERT_SEVERITY[evaluation.status] > ALERT_SEVERITY[previous]
    }
  }

  markNotified(at: Date = new Date()): void {
    this._props = { ...this._props, lastNotifiedAt: at, updatedAt: at }
  }

  private static normalize(props: ScheduleProps): ScheduleProps {
    const title = props.title?.trim()

    if (!title) {
      throw new PayloadError('title must not be empty')
    }

    if (!props.triggerRule) {
      throw new PayloadError('triggerRule must not be empty')
    }

    const intervalMonths = usesTime(props) ? props.intervalMonths : null
    const intervalKm = usesOdometer(props) ? props.intervalKm : null

    if (usesTime(props)) {
      positiveInteger(intervalMonths, 'intervalMonths')
    }

    if (usesOdometer(props)) {
      positiveInteger(intervalKm, 'intervalKm')
    }

    nonNegativeInteger(props.alertDaysBefore, 'alertDaysBefore')
    nonNegativeInteger(props.alertKmBefore, 'alertKmBefore')

    if (
      !(props.lastExecutedAt instanceof Date) ||
      Number.isNaN(props.lastExecutedAt.getTime())
    ) {
      throw new PayloadError('lastExecutedAt must be a valid date')
    }

    const lastExecutedAt = startOfDayUtc(props.lastExecutedAt)

    if (lastExecutedAt > addDaysUtc(startOfDayUtc(new Date()), 1)) {
      throw new PayloadError('lastExecutedAt must not be in the future')
    }

    nonNegativeInteger(props.lastExecutedOdometerKm, 'lastExecutedOdometerKm')

    if (typeof props.isActive !== 'boolean') {
      throw new PayloadError('isActive must be a boolean')
    }

    const rule = { triggerRule: props.triggerRule, intervalMonths, intervalKm }

    return {
      ...props,
      title,
      description: props.description?.trim() || null,
      intervalMonths,
      intervalKm,
      lastExecutedAt,
      ...calculateNextDue(
        rule,
        lastExecutedAt,
        props.lastExecutedOdometerKm as number
      )
    }
  }

  get id(): string {
    return this._props.id
  }

  get vehicleId(): string {
    return this._props.vehicleId
  }

  get userId(): string {
    return this._props.userId
  }

  get title(): string {
    return this._props.title
  }

  get description(): string | null {
    return this._props.description
  }

  get triggerRule(): ScheduleTriggerRule {
    return this._props.triggerRule
  }

  get intervalMonths(): number | null {
    return this._props.intervalMonths
  }

  get intervalKm(): number | null {
    return this._props.intervalKm
  }

  get lastExecutedAt(): Date | null {
    return this._props.lastExecutedAt
  }

  get lastExecutedOdometerKm(): number | null {
    return this._props.lastExecutedOdometerKm
  }

  get nextDueDate(): Date | null {
    return this._props.nextDueDate
  }

  get nextDueOdometerKm(): number | null {
    return this._props.nextDueOdometerKm
  }

  get alertDaysBefore(): number {
    return this._props.alertDaysBefore
  }

  get alertKmBefore(): number {
    return this._props.alertKmBefore
  }

  get alertStatus(): ScheduleAlertStatus {
    return this._props.alertStatus
  }

  get lastNotifiedAt(): Date | null {
    return this._props.lastNotifiedAt
  }

  get isActive(): boolean {
    return this._props.isActive
  }

  get createdAt(): Date {
    return this._props.createdAt
  }

  get updatedAt(): Date {
    return this._props.updatedAt
  }
}

function positiveInteger(value: number | null, field: string) {
  if (value === null || !Number.isInteger(value) || value <= 0) {
    throw new PayloadError(
      `${field} must be a positive integer for this triggerRule`
    )
  }
}

function nonNegativeInteger(value: number | null, field: string) {
  if (value === null || !Number.isInteger(value) || value < 0) {
    throw new PayloadError(`${field} must be a non-negative integer`)
  }
}
