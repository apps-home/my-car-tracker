import { Injectable } from '@nestjs/common'

import { Either, right } from '@/core/utils/Either'

import type {
	ListMaintenanceTasksParams,
	MaintenanceTaskHTTP
} from '../../domain/maintenance-task.entity'
import { MaintenanceTaskRepository } from '../../domain/maintenance-task.repository'

type Response = Either<never, MaintenanceTaskHTTP[]>

@Injectable()
export class ListMaintenanceTasksUseCase {
	constructor(private taskRepository: MaintenanceTaskRepository) {}

	async execute(params: ListMaintenanceTasksParams): Promise<Response> {
		const tasks = await this.taskRepository.list(params)
		return right(tasks.map((task) => task.toHTTP()))
	}
}

