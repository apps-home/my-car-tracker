import { describe, expect, it } from 'vitest'

import { PayloadError } from '@/core/domain/errors/payload-error'

import { MaintenanceTask } from './maintenance-task.entity'

describe('MaintenanceTask entity', () => {
	it('creates a task with defaults and trims strings', () => {
		const task = MaintenanceTask.create('user-1', {
			vehicleId: 'veh-1',
			title: '  Para-barro esquerdo  ',
			notes: '  verificar  '
		})

		expect(task.title).toBe('Para-barro esquerdo')
		expect(task.rawNotes).toBe('verificar')
		expect(task.priority).toBe('NEXT_VISIT')
		expect(task.targetYear).toBeNull()
		expect(task.isCompleted).toBe(false)
		expect(task.completedAt).toBeNull()
	})

	it('toggles completion state and sets completedAt', () => {
		const task = MaintenanceTask.create('user-1', {
			vehicleId: 'veh-1',
			title: 'Velas',
			priority: 'FUTURE',
			targetYear: 2027
		})

		task.update({ isCompleted: true })
		expect(task.isCompleted).toBe(true)
		expect(task.completedAt).toBeInstanceOf(Date)

		task.update({ isCompleted: false })
		expect(task.isCompleted).toBe(false)
		expect(task.completedAt).toBeNull()
	})

	it('throws PayloadError for empty title or invalid targetYear', () => {
		expect(() =>
			MaintenanceTask.create('user-1', {
				vehicleId: 'veh-1',
				title: '   '
			})
		).toThrow(PayloadError)

		expect(() =>
			MaintenanceTask.create('user-1', {
				vehicleId: 'veh-1',
				title: 'Freios',
				targetYear: 1990
			})
		).toThrow(PayloadError)
	})
})

