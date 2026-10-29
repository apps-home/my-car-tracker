import { faker } from '@faker-js/faker'
import { BadRequestException, NotFoundException } from '@nestjs/common'
import { Test } from '@nestjs/testing'
import { makeSchedulePayload } from '@test/factories/make-schedule'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { PayloadError } from '@/core/domain/errors/payload-error'
import { left, right } from '@/core/utils/Either'

import { ScheduleNotFoundError } from '../application/errors/schedule-not-found.error'
import { CreateScheduleUseCase } from '../application/use-cases/create-schedule'
import { DeleteScheduleUseCase } from '../application/use-cases/delete-schedule'
import { FindScheduleByIdUseCase } from '../application/use-cases/find-schedule'
import { ListScheduleTemplatesUseCase } from '../application/use-cases/list-schedule-templates'
import { ListSchedulesUseCase } from '../application/use-cases/list-schedules'
import { SeedDefaultSchedulesUseCase } from '../application/use-cases/seed-default-schedules'
import { UpdateScheduleUseCase } from '../application/use-cases/update-schedule'
import { ScheduleController } from './schedule.controller'

describe('ScheduleController', () => {
  let controller: ScheduleController
  const createSchedule = { execute: vi.fn() }
  const seedDefaults = { execute: vi.fn() }
  const listSchedules = { execute: vi.fn() }
  const findSchedule = { execute: vi.fn() }
  const updateSchedule = { execute: vi.fn() }
  const deleteSchedule = { execute: vi.fn() }

  beforeEach(async () => {
    vi.clearAllMocks()

    const module = await Test.createTestingModule({
      controllers: [ScheduleController],
      providers: [
        { provide: CreateScheduleUseCase, useValue: createSchedule },
        { provide: SeedDefaultSchedulesUseCase, useValue: seedDefaults },
        { provide: ListSchedulesUseCase, useValue: listSchedules },
        ListScheduleTemplatesUseCase,
        { provide: FindScheduleByIdUseCase, useValue: findSchedule },
        { provide: UpdateScheduleUseCase, useValue: updateSchedule },
        { provide: DeleteScheduleUseCase, useValue: deleteSchedule }
      ]
    }).compile()

    controller = module.get(ScheduleController)
  })

  it('should answer with the id when the schedule is created', async () => {
    const id = faker.string.uuid()
    createSchedule.execute.mockResolvedValue(right({ id }))
    const userId = faker.string.alphanumeric(32)
    const dto = makeSchedulePayload()

    expect(await controller.create(dto, userId)).toEqual({
      message: 'Schedule created successfully',
      id
    })
    expect(createSchedule.execute).toHaveBeenCalledWith(userId, dto)
  })

  it('should answer how many default schedules were created', async () => {
    seedDefaults.execute.mockResolvedValue(right([{}, {}]))

    expect(
      await controller.seedDefaults(
        { vehicleId: faker.string.uuid() },
        faker.string.alphanumeric(32)
      )
    ).toEqual({ message: 'Default schedules created successfully', created: 2 })
  })

  it('should list the templates', () => {
    expect(controller.templates().length).toBeGreaterThan(0)
  })

  it('should map the errors', async () => {
    createSchedule.execute.mockResolvedValue(left(new PayloadError('Invalid')))
    findSchedule.execute.mockResolvedValue(left(new ScheduleNotFoundError()))
    const userId = faker.string.alphanumeric(32)

    await expect(
      controller.create(makeSchedulePayload(), userId)
    ).rejects.toThrow(BadRequestException)
    await expect(
      controller.findById(faker.string.uuid(), userId)
    ).rejects.toThrow(NotFoundException)
  })
})
