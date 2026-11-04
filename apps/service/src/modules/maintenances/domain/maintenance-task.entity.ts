import { randomUUID } from 'node:crypto'

import { PayloadError } from '@/core/domain/errors/payload-error'
import { omitUndefined } from '@/core/utils/omit-undefined'

export const MAINTENANCE_TASK_PRIORITIES = [
  'NEXT_VISIT',
  'FUTURE',
  'RECURRING'
] as const

export type MaintenanceTaskPriority =
  (typeof MAINTENANCE_TASK_PRIORITIES)[number]

export interface CreateMaintenanceTaskPayload {
  vehicleId: string
  title: string
  priority?: MaintenanceTaskPriority
  targetYear?: number | null
  targetMonth?: number | null
  intervalDays?: number | null
  notes?: string | null
}

export type UpdateMaintenanceTaskPayload = Partial<
  Omit<CreateMaintenanceTaskPayload, 'vehicleId'>
> & {
  isCompleted?: boolean
  /** Para tarefas periódicas: registra "feito hoje" e recalcula o vencimento */
  markAsDone?: boolean
}

export interface ListMaintenanceTasksParams {
  userId: string
  vehicleId?: string
  includeCompleted?: boolean
}

export interface MaintenanceTaskProps {
  id: string
  vehicleId: string
  userId: string
  title: string
  priority: MaintenanceTaskPriority
  targetYear: number | null
  targetMonth: number | null
  intervalDays: number | null
  lastDoneAt: Date | null
  nextDueDate: Date | null
  notes: string | null
  isCompleted: boolean
  completedAt: Date | null
  createdAt: Date
  updatedAt: Date
}

export type MaintenanceTaskHTTP = Omit<MaintenanceTaskProps, 'userId'>

export class MaintenanceTask {
  private _props: MaintenanceTaskProps

  constructor(props: MaintenanceTaskProps) {
    this._props = props
  }

  static create(
    userId: string,
    data: CreateMaintenanceTaskPayload
  ): MaintenanceTask {
    const now = new Date()

    return new MaintenanceTask(
      MaintenanceTask.normalize({
        id: randomUUID(),
        vehicleId: data.vehicleId,
        userId,
        title: data.title,
        priority: data.priority ?? 'NEXT_VISIT',
        targetYear: data.targetYear ?? null,
        targetMonth: data.targetMonth ?? null,
        intervalDays: data.intervalDays ?? null,
        lastDoneAt: null,
        nextDueDate: MaintenanceTask.computeFirstDueDate(data, now),
        notes: data.notes ?? null,
        isCompleted: false,
        completedAt: null,
        createdAt: now,
        updatedAt: now
      })
    )
  }

  update(data: UpdateMaintenanceTaskPayload): void {
    const { markAsDone, ...rest } = data
    const changes = omitUndefined(rest)
    const now = new Date()

    let completedAt = this._props.completedAt
    if (changes.isCompleted !== undefined) {
      completedAt = changes.isCompleted ? (completedAt ?? now) : null
    }

    const merged = { ...this._props, ...changes, completedAt, updatedAt: now }

    if (merged.priority === 'RECURRING') {
      // Periódicas nunca ficam "concluídas": só registram execuções
      merged.isCompleted = false
      merged.completedAt = null

      if (markAsDone) {
        merged.lastDoneAt = now
        merged.nextDueDate = MaintenanceTask.addDays(now, merged.intervalDays)
      } else if (
        changes.intervalDays !== undefined ||
        changes.targetMonth !== undefined ||
        changes.targetYear !== undefined
      ) {
        merged.nextDueDate = merged.lastDoneAt
          ? MaintenanceTask.addDays(merged.lastDoneAt, merged.intervalDays)
          : MaintenanceTask.computeFirstDueDate(merged, now)
      }
    }

    this._props = MaintenanceTask.normalize(merged)
  }

  private static addDays(date: Date, days: number | null | undefined) {
    if (!days) return null
    const result = new Date(date)
    result.setUTCDate(result.getUTCDate() + days)
    return result
  }

  private static computeFirstDueDate(
    data: {
      priority?: MaintenanceTaskPriority
      targetYear?: number | null
      targetMonth?: number | null
      intervalDays?: number | null
    },
    now: Date
  ): Date | null {
    if (data.priority !== 'RECURRING') return null

    if (data.targetYear && data.targetMonth) {
      return new Date(Date.UTC(data.targetYear, data.targetMonth - 1, 1))
    }

    return MaintenanceTask.addDays(now, data.intervalDays)
  }

  toHTTP(): MaintenanceTaskHTTP {
    const { userId: _, ...rest } = this._props
    return { ...rest }
  }

  private static normalize(props: MaintenanceTaskProps): MaintenanceTaskProps {
    const title = props.title?.trim()

    if (!title) {
      throw new PayloadError('title must not be empty')
    }

    if (
      !props.priority ||
      !MAINTENANCE_TASK_PRIORITIES.includes(props.priority)
    ) {
      throw new PayloadError('priority must be NEXT_VISIT, FUTURE or RECURRING')
    }

    if (
      props.targetYear !== null &&
      (!Number.isInteger(props.targetYear) ||
        props.targetYear < 2000 ||
        props.targetYear > 2100)
    ) {
      throw new PayloadError(
        'targetYear must be an integer between 2000 and 2100'
      )
    }

    if (
      props.targetMonth !== null &&
      (!Number.isInteger(props.targetMonth) ||
        props.targetMonth < 1 ||
        props.targetMonth > 12)
    ) {
      throw new PayloadError('targetMonth must be an integer between 1 and 12')
    }

    if (props.targetMonth !== null && props.targetYear === null) {
      throw new PayloadError('targetYear is required when targetMonth is set')
    }

    if (
      props.intervalDays !== null &&
      (!Number.isInteger(props.intervalDays) || props.intervalDays < 1)
    ) {
      throw new PayloadError('intervalDays must be a positive integer')
    }

    if (props.priority === 'RECURRING' && props.intervalDays === null) {
      throw new PayloadError('intervalDays is required for recurring tasks')
    }

    return {
      ...props,
      title,
      notes: props.notes?.trim() || null
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

  get priority(): MaintenanceTaskPriority {
    return this._props.priority
  }

  get targetYear(): number | null {
    return this._props.targetYear
  }

  get targetMonth(): number | null {
    return this._props.targetMonth
  }

  get intervalDays(): number | null {
    return this._props.intervalDays
  }

  get lastDoneAt(): Date | null {
    return this._props.lastDoneAt
  }

  get nextDueDate(): Date | null {
    return this._props.nextDueDate
  }

  get notes(): string {
    return this._props.notes ?? ''
  }

  get rawNotes(): string | null {
    return this._props.notes
  }

  get isCompleted(): boolean {
    return this._props.isCompleted
  }

  get completedAt(): Date | null {
    return this._props.completedAt
  }

  get createdAt(): Date {
    return this._props.createdAt
  }

  get updatedAt(): Date {
    return this._props.updatedAt
  }
}
