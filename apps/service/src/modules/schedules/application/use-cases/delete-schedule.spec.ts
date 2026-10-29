import { faker } from '@faker-js/faker'
import { makeSchedule } from '@test/factories/make-schedule'
import { InMemoryScheduleRepository } from '@test/repositories/in-memory-schedule.repository'
import { beforeEach, describe, expect, it } from 'vitest'

import { ScheduleNotFoundError } from '../errors/schedule-not-found.error'
import { DeleteScheduleUseCase } from './delete-schedule'

describe('DeleteScheduleUseCase', () => {
  let scheduleRepository: InMemoryScheduleRepository
  let sut: DeleteScheduleUseCase

  beforeEach(() => {
    scheduleRepository = new InMemoryScheduleRepository()
    sut = new DeleteScheduleUseCase(scheduleRepository)
  })

  it('should delete a schedule of the user', async () => {
    const schedule = makeSchedule()
    scheduleRepository.items.push(schedule)

    const result = await sut.execute(schedule.userId, schedule.id)

    expect(result.isRight()).toBe(true)
    expect(scheduleRepository.items).toHaveLength(0)
  })

  it('should not delete the schedule of another user', async () => {
    const schedule = makeSchedule()
    scheduleRepository.items.push(schedule)

    const result = await sut.execute(faker.string.alphanumeric(32), schedule.id)

    expect(result.value).toBeInstanceOf(ScheduleNotFoundError)
    expect(scheduleRepository.items).toHaveLength(1)
  })
})
