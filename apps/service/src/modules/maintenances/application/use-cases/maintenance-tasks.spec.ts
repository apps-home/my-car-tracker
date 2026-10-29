import { makeVehicle } from '@test/factories/make-vehicle'
import { InMemoryMaintenanceTaskRepository } from '@test/repositories/in-memory-maintenance-task.repository'
import { InMemoryVehicleRepository } from '@test/repositories/in-memory-vehicle.repository'
import { beforeEach, describe, expect, it } from 'vitest'

import { MaintenanceTaskNotFoundError } from '../errors/maintenance-task-not-found.error'
import { CreateMaintenanceTaskUseCase } from './create-maintenance-task'
import { DeleteMaintenanceTaskUseCase } from './delete-maintenance-task'
import { ListMaintenanceTasksUseCase } from './list-maintenance-tasks'
import { UpdateMaintenanceTaskUseCase } from './update-maintenance-task'

describe('MaintenanceTask use cases', () => {
	let vehicleRepository: InMemoryVehicleRepository
	let taskRepository: InMemoryMaintenanceTaskRepository
	let createTask: CreateMaintenanceTaskUseCase
	let listTasks: ListMaintenanceTasksUseCase
	let updateTask: UpdateMaintenanceTaskUseCase
	let deleteTask: DeleteMaintenanceTaskUseCase

	beforeEach(() => {
		vehicleRepository = new InMemoryVehicleRepository()
		taskRepository = new InMemoryMaintenanceTaskRepository()
		createTask = new CreateMaintenanceTaskUseCase(
			taskRepository,
			vehicleRepository
		)
		listTasks = new ListMaintenanceTasksUseCase(taskRepository)
		updateTask = new UpdateMaintenanceTaskUseCase(taskRepository)
		deleteTask = new DeleteMaintenanceTaskUseCase(taskRepository)
	})

	it('creates, lists, completes and deletes maintenance tasks scoped by user', async () => {
		const userId = 'user-1'
		const vehicle = makeVehicle({ userId })
		await vehicleRepository.create(vehicle)

		const created = await createTask.execute(userId, {
			vehicleId: vehicle.id,
			title: 'Trocar refletor motorista',
			priority: 'NEXT_VISIT'
		})

		expect(created.isRight()).toBe(true)
		if (!created.isRight()) return

		const listResult = await listTasks.execute({
			userId,
			vehicleId: vehicle.id
		})
		expect(listResult.value).toHaveLength(1)

		const updateResult = await updateTask.execute(userId, created.value.id, {
			isCompleted: true
		})
		expect(updateResult.isRight()).toBe(true)

		const otherUserAttempt = await updateTask.execute(
			'other-user',
			created.value.id,
			{ title: 'Hacked' }
		)
		expect(otherUserAttempt.isLeft()).toBe(true)
		expect(otherUserAttempt.value).toBeInstanceOf(MaintenanceTaskNotFoundError)

		const deleteResult = await deleteTask.execute(userId, created.value.id)
		expect(deleteResult.isRight()).toBe(true)
		expect(taskRepository.items).toHaveLength(0)
	})
})

