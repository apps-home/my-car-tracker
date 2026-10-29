import type {
	ListMaintenanceTasksParams,
	MaintenanceTask
} from './maintenance-task.entity'

export abstract class MaintenanceTaskRepository {
	abstract findById(
		id: string,
		userId: string
	): Promise<MaintenanceTask | null>
	abstract list(params: ListMaintenanceTasksParams): Promise<MaintenanceTask[]>
	abstract create(task: MaintenanceTask): Promise<void>
	abstract save(task: MaintenanceTask): Promise<void>
	abstract delete(task: MaintenanceTask): Promise<void>
}

