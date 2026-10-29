import { Injectable } from '@nestjs/common'

import { PayloadError } from '@/core/domain/errors/payload-error'
import { Either, left, right } from '@/core/utils/Either'

import type { UpdateMaintenanceTaskPayload } from '../../domain/maintenance-task.entity'
import { MaintenanceTaskRepository } from '../../domain/maintenance-task.repository'
import { MaintenanceTaskNotFoundError } from '../errors/maintenance-task-not-found.error'

type Response = Either<MaintenanceTaskNotFoundError | PayloadError, void>

@Injectable()
export class UpdateMaintenanceTaskUseCase {
	constructor(private taskRepository: MaintenanceTaskRepository) {}

	async execute(
		userId: string,
		id: string,
		data: UpdateMaintenanceTaskPayload
	): Promise<Response> {
		const task = await this.taskRepository.findById(id, userId)

		if (!task) {
			return left(new MaintenanceTaskNotFoundError())
		}

		try {
			task.update(data)
			await this.taskRepository.save(task)
			return right(void 0)
		} catch (error) {
			if (error instanceof PayloadError) {
				return left(error)
			}
			throw error
		}
	}
}

