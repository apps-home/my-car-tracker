import { Injectable } from '@nestjs/common'

import { Either, left, right } from '@/core/utils/Either'

import { MaintenanceTaskRepository } from '../../domain/maintenance-task.repository'
import { MaintenanceTaskNotFoundError } from '../errors/maintenance-task-not-found.error'

type Response = Either<MaintenanceTaskNotFoundError, void>

@Injectable()
export class DeleteMaintenanceTaskUseCase {
	constructor(private taskRepository: MaintenanceTaskRepository) {}

	async execute(userId: string, id: string): Promise<Response> {
		const task = await this.taskRepository.findById(id, userId)

		if (!task) {
			return left(new MaintenanceTaskNotFoundError())
		}

		await this.taskRepository.delete(task)
		return right(void 0)
	}
}

