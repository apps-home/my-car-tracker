import { NotFoundException } from '@nestjs/common'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { left, right } from '@/core/utils/Either'
import { VehicleNotFoundError } from '@/modules/vehicles/application/errors/vehicle-not-found.error'

import type { GetAnalyticsOverviewUseCase } from '../application/use-cases/get-analytics-overview'
import type { GetMonthlyCostsUseCase } from '../application/use-cases/get-monthly-costs'
import { AnalyticsController } from './analytics.controller'

describe('AnalyticsController', () => {
	let getAnalyticsOverviewUseCase: { execute: ReturnType<typeof vi.fn> }
	let getMonthlyCostsUseCase: { execute: ReturnType<typeof vi.fn> }
	let controller: AnalyticsController

	beforeEach(() => {
		getAnalyticsOverviewUseCase = { execute: vi.fn() }
		getMonthlyCostsUseCase = { execute: vi.fn() }
		controller = new AnalyticsController(
			getAnalyticsOverviewUseCase as unknown as GetAnalyticsOverviewUseCase,
			getMonthlyCostsUseCase as unknown as GetMonthlyCostsUseCase
		)
	})

	it('returns overview when use case succeeds', async () => {
		const payload = { vehicleId: 'veh-1', totalCost: 1200 }
		getAnalyticsOverviewUseCase.execute.mockResolvedValue(right(payload))

		const response = await controller.overview(
			{ vehicleId: 'veh-1', year: 2026 },
			'user-1'
		)

		expect(response).toEqual(payload)
		expect(getAnalyticsOverviewUseCase.execute).toHaveBeenCalledWith({
			userId: 'user-1',
			vehicleId: 'veh-1',
			year: 2026
		})
	})

	it('throws NotFoundException when overview returns VehicleNotFoundError', async () => {
		getAnalyticsOverviewUseCase.execute.mockResolvedValue(
			left(new VehicleNotFoundError())
		)

		await expect(
			controller.overview({ vehicleId: 'veh-1' }, 'user-1')
		).rejects.toThrow(NotFoundException)
	})

	it('returns monthly costs when use case succeeds', async () => {
		const payload = { vehicleId: 'veh-1', year: 2026, yearTotal: 800, months: [] }
		getMonthlyCostsUseCase.execute.mockResolvedValue(right(payload))

		const response = await controller.monthlyCosts(
			{ vehicleId: 'veh-1', year: 2026 },
			'user-1'
		)

		expect(response).toEqual(payload)
	})
})

