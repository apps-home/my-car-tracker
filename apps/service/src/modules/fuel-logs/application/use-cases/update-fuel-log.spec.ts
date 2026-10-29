import { faker } from '@faker-js/faker'
import { FakeEventPublisher } from '@test/events/fake-event-publisher'
import { makeFuelLog } from '@test/factories/make-fuel-log'
import { makeVehicle } from '@test/factories/make-vehicle'
import { InMemoryFuelLogRepository } from '@test/repositories/in-memory-fuel-log.repository'
import { InMemoryVehicleRepository } from '@test/repositories/in-memory-vehicle.repository'
import { beforeEach, describe, expect, it } from 'vitest'

import { PayloadError } from '@/core/domain/errors/payload-error'
import { SyncVehicleOdometerService } from '@/modules/vehicles/application/services/sync-vehicle-odometer'
import type { Vehicle } from '@/modules/vehicles/domain/vehicle.entity'

import { FuelLogNotFoundError } from '../errors/fuel-log-not-found.error'
import { UpdateFuelLogUseCase } from './update-fuel-log'

describe('UpdateFuelLogUseCase', () => {
  let fuelLogRepository: InMemoryFuelLogRepository
  let vehicleRepository: InMemoryVehicleRepository
  let sut: UpdateFuelLogUseCase
  let vehicle: Vehicle

  beforeEach(() => {
    fuelLogRepository = new InMemoryFuelLogRepository()
    vehicleRepository = new InMemoryVehicleRepository()
    sut = new UpdateFuelLogUseCase(
      fuelLogRepository,
      vehicleRepository,
      new SyncVehicleOdometerService(
        vehicleRepository,
        new FakeEventPublisher()
      )
    )

    vehicle = makeVehicle({
      initialOdometerKm: 10_000,
      currentOdometerKm: 10_500
    })
    vehicleRepository.items.push(vehicle)
  })

  function existingLog(odometerKm: number, date: string, isFullTank = true) {
    const fuelLog = makeFuelLog({
      vehicleId: vehicle.id,
      userId: vehicle.userId,
      odometerKm,
      date: new Date(date),
      isFullTank,
      liters: 40,
      pricePerLiter: 5,
      totalCost: 200
    })
    fuelLogRepository.items.push(fuelLog)
    return fuelLog
  }

  it('should update the fuel log and recalculate the chain', async () => {
    existingLog(10_000, '2026-03-01')
    const partial = existingLog(10_200, '2026-03-05', false)
    const full = existingLog(10_500, '2026-03-10')

    const result = await sut.execute(vehicle.userId, partial.id, {
      isFullTank: true
    })

    expect(result.isRight()).toBe(true)
    expect(fuelLogRepository.byId(partial.id)?.distanceDrivenKm).toBe(200)
    expect(fuelLogRepository.byId(full.id)?.distanceDrivenKm).toBe(300)
    expect(fuelLogRepository.byId(full.id)?.consumptionKmPerLiter).toBe(7.5)
  })

  it('should sync the vehicle odometer when the km goes up', async () => {
    const fuelLog = existingLog(10_500, '2026-03-10')

    await sut.execute(vehicle.userId, fuelLog.id, { odometerKm: 10_800 })

    expect(vehicleRepository.items[0].currentOdometerKm).toBe(10_800)
  })

  it('should not update the fuel log of another user', async () => {
    const fuelLog = existingLog(10_500, '2026-03-10')

    const result = await sut.execute(
      faker.string.alphanumeric(32),
      fuelLog.id,
      {
        liters: 1
      }
    )

    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(FuelLogNotFoundError)
    expect(fuelLogRepository.byId(fuelLog.id)?.liters).toBe(40)
  })

  it('should reject a conflicting odometer without changing anything', async () => {
    existingLog(10_000, '2026-03-01')
    const fuelLog = existingLog(10_500, '2026-03-10')

    const result = await sut.execute(vehicle.userId, fuelLog.id, {
      odometerKm: 10_000 - 1
    })

    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(PayloadError)
    expect(fuelLogRepository.byId(fuelLog.id)?.odometerKm).toBe(10_500)
  })
})
