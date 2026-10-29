import { faker } from '@faker-js/faker'
import { BadRequestException, NotFoundException } from '@nestjs/common'
import { Test } from '@nestjs/testing'
import { makeVehiclePayload } from '@test/factories/make-vehicle'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { PayloadError } from '@/core/domain/errors/payload-error'
import { left, right } from '@/core/utils/Either'

import { VehicleNotFoundError } from '../application/errors/vehicle-not-found.error'
import { CreateVehicleUseCase } from '../application/use-cases/create-vehicle'
import { DeleteVehicleUseCase } from '../application/use-cases/delete-vehicle'
import { FindVehicleByIdUseCase } from '../application/use-cases/find-vehicle'
import { ListVehiclesUseCase } from '../application/use-cases/list-vehicles'
import { UpdateVehicleUseCase } from '../application/use-cases/update-vehicle'
import { VehicleController } from './vehicle.controller'

describe('VehicleController', () => {
  let controller: VehicleController
  const createVehicle = { execute: vi.fn() }
  const listVehicles = { execute: vi.fn() }
  const findVehicle = { execute: vi.fn() }
  const updateVehicle = { execute: vi.fn() }
  const deleteVehicle = { execute: vi.fn() }

  beforeEach(async () => {
    vi.clearAllMocks()

    const module = await Test.createTestingModule({
      controllers: [VehicleController],
      providers: [
        { provide: CreateVehicleUseCase, useValue: createVehicle },
        { provide: ListVehiclesUseCase, useValue: listVehicles },
        { provide: FindVehicleByIdUseCase, useValue: findVehicle },
        { provide: UpdateVehicleUseCase, useValue: updateVehicle },
        { provide: DeleteVehicleUseCase, useValue: deleteVehicle }
      ]
    }).compile()

    controller = module.get(VehicleController)
  })

  it('should answer with a message and the id when the vehicle is created', async () => {
    const id = faker.string.uuid()
    createVehicle.execute.mockResolvedValue(right({ id }))
    const userId = faker.string.alphanumeric(32)
    const dto = makeVehiclePayload()

    const response = await controller.create(dto, userId)

    expect(response).toEqual({ message: 'Vehicle created successfully', id })
    expect(createVehicle.execute).toHaveBeenCalledWith(userId, dto)
  })

  it('should throw BadRequestException on PayloadError', async () => {
    createVehicle.execute.mockResolvedValue(left(new PayloadError('Invalid')))

    await expect(
      controller.create(makeVehiclePayload(), faker.string.alphanumeric(32))
    ).rejects.toThrow(BadRequestException)
  })

  it('should pass the status filter with the session user', async () => {
    listVehicles.execute.mockResolvedValue(right([]))
    const userId = faker.string.alphanumeric(32)

    const response = await controller.list({ status: 'INACTIVE' }, userId)

    expect(response).toEqual([])
    expect(listVehicles.execute).toHaveBeenCalledWith({
      userId,
      status: 'INACTIVE'
    })
  })

  it('should throw NotFoundException when the vehicle is not found', async () => {
    findVehicle.execute.mockResolvedValue(left(new VehicleNotFoundError()))

    await expect(
      controller.findById(faker.string.uuid(), faker.string.alphanumeric(32))
    ).rejects.toThrow(NotFoundException)
  })

  it('should answer with a message when the vehicle is updated', async () => {
    updateVehicle.execute.mockResolvedValue(right(undefined))

    const response = await controller.update(
      faker.string.uuid(),
      { isActive: false },
      faker.string.alphanumeric(32)
    )

    expect(response).toEqual({ message: 'Vehicle updated successfully' })
  })

  it('should throw NotFoundException when deleting a missing vehicle', async () => {
    deleteVehicle.execute.mockResolvedValue(left(new VehicleNotFoundError()))

    await expect(
      controller.delete(faker.string.uuid(), faker.string.alphanumeric(32))
    ).rejects.toThrow(NotFoundException)
  })
})
