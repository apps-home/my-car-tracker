import { randomUUID } from 'node:crypto'

import { PayloadError } from '@/core/domain/errors/payload-error'
import { omitUndefined } from '@/core/utils/omit-undefined'

export const MAINTENANCE_TASK_PRIORITIES = ['NEXT_VISIT', 'FUTURE'] as const

export type MaintenanceTaskPriority =
	(typeof MAINTENANCE_TASK_PRIORITIES)[number]

export interface CreateMaintenanceTaskPayload {
	vehicleId: string
	title: string
	priority?: MaintenanceTaskPriority
	targetYear?: number | null
	notes?: string | null
}

export type UpdateMaintenanceTaskPayload = Partial<
	Omit<CreateMaintenanceTaskPayload, 'vehicleId'>
> & {
	isCompleted?: boolean
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
				notes: data.notes ?? null,
				isCompleted: false,
				completedAt: null,
				createdAt: now,
				updatedAt: now
			})
		)
	}

	update(data: UpdateMaintenanceTaskPayload): void {
		const changes = omitUndefined(data)
		const now = new Date()

		let completedAt = this._props.completedAt
		if (changes.isCompleted !== undefined) {
			completedAt = changes.isCompleted ? (completedAt ?? now) : null
		}

		this._props = MaintenanceTask.normalize({
			...this._props,
			...changes,
			completedAt,
			updatedAt: now
		})
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
			throw new PayloadError('priority must be NEXT_VISIT or FUTURE')
		}

		if (
			props.targetYear !== null &&
			(!Number.isInteger(props.targetYear) ||
				props.targetYear < 2000 ||
				props.targetYear > 2100)
		) {
			throw new PayloadError('targetYear must be an integer between 2000 and 2100')
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

