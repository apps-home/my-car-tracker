import { faker } from '@faker-js/faker'
import { makeSchedule } from '@test/factories/make-schedule'
import { makeVehicle } from '@test/factories/make-vehicle'
import { InMemoryScheduleRepository } from '@test/repositories/in-memory-schedule.repository'
import { InMemoryVehicleRepository } from '@test/repositories/in-memory-vehicle.repository'
import { beforeEach, describe, expect, it } from 'vitest'

import { PayloadError } from '@/core/domain/errors/payload-error'
import { VehicleNotFoundError } from '@/modules/vehicles/application/errors/vehicle-not-found.error'
import type { Vehicle } from '@/modules/vehicles/domain/vehicle.entity'

import { DEFAULT_SCHEDULE_TEMPLATES } from '../../domain/default-schedule-templates'
import { SeedDefaultSchedulesUseCase } from './seed-default-schedules'

describe('SeedDefaultSchedulesUseCase', () => {
  let scheduleRepository: InMemoryScheduleRepository
  let vehicleRepository: InMemoryVehicleRepository
  let sut: SeedDefaultSchedulesUseCase
  let vehicle: Vehicle

  beforeEach(() => {
    scheduleRepository = new InMemoryScheduleRepository()
    vehicleRepository = new InMemoryVehicleRepository()
    sut = new SeedDefaultSchedulesUseCase(scheduleRepository, vehicleRepository)

    vehicle = makeVehicle({ initialOdometerKm: 0, currentOdometerKm: 20_000 })
    vehicleRepository.items.push(vehicle)
  })

  it('should create every default template', async () => {
    const result = await sut.execute(vehicle.userId, { vehicleId: vehicle.id })

    expect(result.isRight()).toBe(true)
    expect(scheduleRepository.items).toHaveLength(
      DEFAULT_SCHEDULE_TEMPLATES.length
    )
    const oil = scheduleRepository.items.find(({ title }) =>
      title.startsWith('Troca de óleo')
    )
    expect(oil?.nextDueOdometerKm).toBe(30_000)
  })

  it('should create only the chosen templates and skip existing titles', async () => {
    scheduleRepository.items.push(
      makeSchedule({
        userId: vehicle.userId,
        vehicleId: vehicle.id,
        title: 'troca de óleo e filtro de óleo'
      })
    )

    const result = await sut.execute(vehicle.userId, {
      vehicleId: vehicle.id,
      templates: ['oil-change', 'wiper-blades']
    })

    expect(result.isRight()).toBe(true)
    expect(result.value).toHaveLength(1)
    expect(scheduleRepository.items).toHaveLength(2)
  })

  it('should reject an unknown template', async () => {
    const result = await sut.execute(vehicle.userId, {
      vehicleId: vehicle.id,
      templates: ['flux-capacitor']
    })

    expect(result.value).toBeInstanceOf(PayloadError)
    expect(scheduleRepository.items).toHaveLength(0)
  })

  it('should not seed a vehicle of another user', async () => {
    const result = await sut.execute(faker.string.alphanumeric(32), {
      vehicleId: vehicle.id
    })

    expect(result.value).toBeInstanceOf(VehicleNotFoundError)
    expect(scheduleRepository.items).toHaveLength(0)
  })
})
