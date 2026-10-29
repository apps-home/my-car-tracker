import {
	type ListMaintenanceTasksParams,
	MaintenanceTask
} from '@/modules/maintenances/domain/maintenance-task.entity'
import type { MaintenanceTaskRepository } from '@/modules/maintenances/domain/maintenance-task.repository'

function clone(task: MaintenanceTask): MaintenanceTask {
	return new MaintenanceTask({
		...task.toHTTP(),
		userId: task.userId
	})
}

export class InMemoryMaintenanceTaskRepository
	implements MaintenanceTaskRepository
{
	public items: MaintenanceTask[] = []

	async findById(id: string, userId: string): Promise<MaintenanceTask | null> {
		const task = this.items.find(
			(item) => item.id === id && item.userId === userId
		)
		return task ? clone(task) : null
	}

	async list({
		userId,
		vehicleId,
		includeCompleted = true
	}: ListMaintenanceTasksParams): Promise<MaintenanceTask[]> {
		return this.items
			.filter((item) => item.userId === userId)
			.filter((item) => !vehicleId || item.vehicleId === vehicleId)
			.filter((item) => includeCompleted || !item.isCompleted)
			.map(clone)
	}

	async create(task: MaintenanceTask): Promise<void> {
		this.items.push(clone(task))
	}

	async save(task: MaintenanceTask): Promise<void> {
		const index = this.items.findIndex((item) => item.id === task.id)
		this.items[index] = clone(task)
	}

	async delete(task: MaintenanceTask): Promise<void> {
		this.items = this.items.filter((item) => item.id !== task.id)
	}
}

