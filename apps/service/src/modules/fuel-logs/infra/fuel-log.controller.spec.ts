import { faker } from '@faker-js/faker'
import { BadRequestException, NotFoundException } from '@nestjs/common'
import { Test } from '@nestjs/testing'
import { makeFuelLogPayload } from '@test/factories/make-fuel-log'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { PayloadError } from '@/core/domain/errors/payload-error'
import { left, right } from '@/core/utils/Either'
import { VehicleNotFoundError } from '@/modules/vehicles/application/errors/vehicle-not-found.error'

import { FuelLogNotFoundError } from '../application/errors/fuel-log-not-found.error'
import { CreateFuelLogUseCase } from '../application/use-cases/create-fuel-log'
import { DeleteFuelLogUseCase } from '../application/use-cases/delete-fuel-log'
import { FindFuelLogByIdUseCase } from '../application/use-cases/find-fuel-log'
import { GetFuelLogSummaryUseCase } from '../application/use-cases/get-fuel-log-summary'
import { ListFuelLogsUseCase } from '../application/use-cases/list-fuel-logs'
import { UpdateFuelLogUseCase } from '../application/use-cases/update-fuel-log'
import { FuelLogController } from './fuel-log.controller'

describe('FuelLogController', () => {
  let controller: FuelLogController
  const createFuelLog = { execute: vi.fn() }
  const listFuelLogs = { execute: vi.fn() }
  const getSummary = { execute: vi.fn() }
  const findFuelLog = { execute: vi.fn() }
  const updateFuelLog = { execute: vi.fn() }
  const deleteFuelLog = { execute: vi.fn() }

  beforeEach(async () => {
    vi.clearAllMocks()

    const module = await Test.createTestingModule({
      controllers: [FuelLogController],
      providers: [
        { provide: CreateFuelLogUseCase, useValue: createFuelLog },
        { provide: ListFuelLogsUseCase, useValue: listFuelLogs },
        { provide: GetFuelLogSummaryUseCase, useValue: getSummary },
        { provide: FindFuelLogByIdUseCase, useValue: findFuelLog },
        { provide: UpdateFuelLogUseCase, useValue: updateFuelLog },
        { provide: DeleteFuelLogUseCase, useValue: deleteFuelLog }
      ]
    }).compile()

    controller = module.get(FuelLogController)
  })

  it('should answer with a message and the id when the fuel log is created', async () => {
    const id = faker.string.uuid()
    createFuelLog.execute.mockResolvedValue(right({ id }))
    const userId = faker.string.alphanumeric(32)
    const dto = makeFuelLogPayload()

    const response = await controller.create(dto, userId)

    expect(response).toEqual({ message: 'Fuel log created successfully', id })
    expect(createFuelLog.execute).toHaveBeenCalledWith(userId, dto)
  })

  it('should throw BadRequestException on PayloadError', async () => {
    createFuelLog.execute.mockResolvedValue(left(new PayloadError('Invalid')))

    await expect(
      controller.create(makeFuelLogPayload(), faker.string.alphanumeric(32))
    ).rejects.toThrow(BadRequestException)
  })

  it('should list with the filters and the session user', async () => {
    listFuelLogs.execute.mockResolvedValue(right([]))
    const userId = faker.string.alphanumeric(32)

    await controller.list({ year: 2026, fuelType: 'ETHANOL' }, userId)

    expect(listFuelLogs.execute).toHaveBeenCalledWith({
      year: 2026,
      fuelType: 'ETHANOL',
      userId
    })
  })

  it('should throw NotFoundException when the summary vehicle is not found', async () => {
    getSummary.execute.mockResolvedValue(left(new VehicleNotFoundError()))

    await expect(
      controller.summary(
        { vehicleId: faker.string.uuid() },
        faker.string.alphanumeric(32)
      )
    ).rejects.toThrow(NotFoundException)
  })

  it('should throw NotFoundException when the fuel log is not found', async () => {
    findFuelLog.execute.mockResolvedValue(left(new FuelLogNotFoundError()))

    await expect(
      controller.findById(faker.string.uuid(), faker.string.alphanumeric(32))
    ).rejects.toThrow(NotFoundException)
  })

  it('should answer with a message when the fuel log is updated and deleted', async () => {
    updateFuelLog.execute.mockResolvedValue(right(undefined))
    deleteFuelLog.execute.mockResolvedValue(right(undefined))
    const id = faker.string.uuid()
    const userId = faker.string.alphanumeric(32)

    expect(await controller.update(id, { liters: 10 }, userId)).toEqual({
      message: 'Fuel log updated successfully'
    })
    expect(await controller.delete(id, userId)).toEqual({
      message: 'Fuel log deleted successfully'
    })
  })
})
