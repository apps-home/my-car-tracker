import { Injectable } from '@nestjs/common'

import { PayloadError } from '@/core/domain/errors/payload-error'
import { Either, left, right } from '@/core/utils/Either'
import { VehicleNotFoundError } from '@/modules/vehicles/application/errors/vehicle-not-found.error'
import { VehicleRepository } from '@/modules/vehicles/domain/vehicle.repository'

import {
	type CreateMaintenanceTaskPayload,
	MaintenanceTask,
	type MaintenanceTaskHTTP
} from '../../domain/maintenance-task.entity'
import { MaintenanceTaskRepository } from '../../domain/maintenance-task.repository'

type Response = Either<
	VehicleNotFoundError | PayloadError,
	MaintenanceTaskHTTP
>

@Injectable()
export class CreateMaintenanceTaskUseCase {
	constructor(
		private taskRepository: MaintenanceTaskRepository,
		private vehicleRepository: VehicleRepository
	) {}

	async execute(
		userId: string,
		data: CreateMaintenanceTaskPayload
	): Promise<Response> {
		const vehicle = await this.vehicleRepository.findById(
			data.vehicleId,
			userId
		)

		if (!vehicle) {
			return left(new VehicleNotFoundError())
		}

		try {
			const task = MaintenanceTask.create(userId, data)
			await this.taskRepository.create(task)
			return right(task.toHTTP())
		} catch (error) {
			if (error instanceof PayloadError) {
				return left(error)
			}
			throw error
		}
	}
}

