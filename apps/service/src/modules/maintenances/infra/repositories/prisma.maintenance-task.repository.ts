import type { MyCarTracker, Prisma } from '@lib/my-car-tracker-db'
import { Inject, Injectable } from '@nestjs/common'

import {
	type ListMaintenanceTasksParams,
	MaintenanceTask
} from '../../domain/maintenance-task.entity'
import { MaintenanceTaskRepository } from '../../domain/maintenance-task.repository'

function toDomain(
	raw: Prisma.MaintenanceTaskGetPayload<{}>
): MaintenanceTask {
	return new MaintenanceTask({
		id: raw.id,
		vehicleId: raw.vehicleId,
		userId: raw.userId,
		title: raw.title,
		priority: raw.priority,
		targetYear: raw.targetYear,
		notes: raw.notes,
		isCompleted: raw.isCompleted,
		completedAt: raw.completedAt,
		createdAt: raw.createdAt,
		updatedAt: raw.updatedAt
	})
}

@Injectable()
export class PrismaMaintenanceTaskRepository
	implements MaintenanceTaskRepository
{
	constructor(@Inject('prismaMyCarTracker') private prisma: MyCarTracker) {}

	async findById(id: string, userId: string): Promise<MaintenanceTask | null> {
		const raw = await this.prisma.maintenanceTask.findFirst({
			where: { id, userId }
		})

		return raw ? toDomain(raw) : null
	}

	async list({
		userId,
		vehicleId,
		includeCompleted = true
	}: ListMaintenanceTasksParams): Promise<MaintenanceTask[]> {
		const rows = await this.prisma.maintenanceTask.findMany({
			where: {
				userId,
				vehicleId,
				isCompleted: includeCompleted ? undefined : false
			},
			orderBy: [
				{ isCompleted: 'asc' },
				{ priority: 'asc' },
				{ targetYear: 'asc' },
				{ createdAt: 'asc' }
			]
		})

		return rows.map(toDomain)
	}

	async create(task: MaintenanceTask): Promise<void> {
		await this.prisma.maintenanceTask.create({
			data: {
				id: task.id,
				vehicleId: task.vehicleId,
				userId: task.userId,
				title: task.title,
				priority: task.priority,
				targetYear: task.targetYear,
				notes: task.rawNotes,
				isCompleted: task.isCompleted,
				completedAt: task.completedAt,
				createdAt: task.createdAt,
				updatedAt: task.updatedAt
			}
		})
	}

	async save(task: MaintenanceTask): Promise<void> {
		await this.prisma.maintenanceTask.update({
			where: { id: task.id, userId: task.userId },
			data: {
				title: task.title,
				priority: task.priority,
				targetYear: task.targetYear,
				notes: task.rawNotes,
				isCompleted: task.isCompleted,
				completedAt: task.completedAt,
				updatedAt: task.updatedAt
			}
		})
	}

	async delete(task: MaintenanceTask): Promise<void> {
		await this.prisma.maintenanceTask.delete({
			where: { id: task.id, userId: task.userId }
		})
	}
}

