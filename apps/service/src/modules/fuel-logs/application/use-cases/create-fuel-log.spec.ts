import { faker } from '@faker-js/faker'
import { FakeEventPublisher } from '@test/events/fake-event-publisher'
import { makeFuelLog, makeFuelLogPayload } from '@test/factories/make-fuel-log'
import { makeVehicle } from '@test/factories/make-vehicle'
import { InMemoryFuelLogRepository } from '@test/repositories/in-memory-fuel-log.repository'
import { InMemoryVehicleRepository } from '@test/repositories/in-memory-vehicle.repository'
import { beforeEach, describe, expect, it } from 'vitest'

import { PayloadError } from '@/core/domain/errors/payload-error'
import { DOMAIN_EVENTS } from '@/core/domain/events/event.constants'
import { VehicleNotFoundError } from '@/modules/vehicles/application/errors/vehicle-not-found.error'
import { SyncVehicleOdometerService } from '@/modules/vehicles/application/services/sync-vehicle-odometer'
import type { Vehicle } from '@/modules/vehicles/domain/vehicle.entity'

import { CreateFuelLogUseCase } from './create-fuel-log'

describe('CreateFuelLogUseCase', () => {
  let fuelLogRepository: InMemoryFuelLogRepository
  let vehicleRepository: InMemoryVehicleRepository
  let eventPublisher: FakeEventPublisher
  let sut: CreateFuelLogUseCase
  let vehicle: Vehicle

  beforeEach(() => {
    fuelLogRepository = new InMemoryFuelLogRepository()
    vehicleRepository = new InMemoryVehicleRepository()
    eventPublisher = new FakeEventPublisher()
    sut = new CreateFuelLogUseCase(
      fuelLogRepository,
      vehicleRepository,
      new SyncVehicleOdometerService(vehicleRepository, eventPublisher)
    )

    vehicle = makeVehicle({
      initialOdometerKm: 10_000,
      currentOdometerKm: 10_000
    })
    vehicleRepository.items.push(vehicle)
  })

  function existingLog(odometerKm: number, date: string, isFullTank = true) {
    const fuelLog = makeFuelLog({
      vehicleId: vehicle.id,
      userId: vehicle.userId,
      odometerKm,
      date: new Date(date),
      isFullTank
    })
    fuelLogRepository.items.push(fuelLog)
    return fuelLog
  }

  it('should create the fuel log and sync the vehicle odometer', async () => {
    const payload = makeFuelLogPayload({
      vehicleId: vehicle.id,
      odometerKm: 10_450
    })

    const result = await sut.execute(vehicle.userId, payload)

    expect(result.isRight()).toBe(true)
    expect(fuelLogRepository.items).toHaveLength(1)
    expect(fuelLogRepository.items[0].userId).toBe(vehicle.userId)
    expect(vehicleRepository.items[0].currentOdometerKm).toBe(10_450)
    expect(eventPublisher.published[0].event).toBe(
      DOMAIN_EVENTS.VEHICLE_ODOMETER_UPDATED
    )
  })

  it('should calculate the consumption against the previous full tank', async () => {
    existingLog(10_000, '2026-03-01')

    const result = await sut.execute(
      vehicle.userId,
      makeFuelLogPayload({
        vehicleId: vehicle.id,
        date: new Date('2026-03-15'),
        odometerKm: 10_500,
        liters: 40,
        pricePerLiter: 5.9
      })
    )

    expect(result.isRight()).toBe(true)
    if (result.isRight()) {
      expect(result.value.distanceDrivenKm).toBe(500)
      expect(result.value.consumptionKmPerLiter).toBe(12.5)
      expect(result.value.costPerKm).toBe(0.472)
    }
  })

  it('should recalculate the next full tank when a past log is inserted', async () => {
    existingLog(10_000, '2026-03-01')
    const next = existingLog(10_600, '2026-03-20')
    vehicle.update({ currentOdometerKm: 10_600 })
    const consumptionBefore = next.consumptionKmPerLiter

    await sut.execute(
      vehicle.userId,
      makeFuelLogPayload({
        vehicleId: vehicle.id,
        date: new Date('2026-03-10'),
        odometerKm: 10_300,
        isFullTank: true
      })
    )

    const recalculated = fuelLogRepository.byId(next.id)
    expect(recalculated?.distanceDrivenKm).toBe(300)
    expect(recalculated?.consumptionKmPerLiter).not.toBe(consumptionBefore)
    expect(vehicleRepository.items[0].currentOdometerKm).toBe(10_600)
  })

  it('should not create a fuel log for a vehicle of another user', async () => {
    const result = await sut.execute(
      faker.string.alphanumeric(32),
      makeFuelLogPayload({ vehicleId: vehicle.id })
    )

    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(VehicleNotFoundError)
    expect(fuelLogRepository.items).toHaveLength(0)
  })

  it('should reject an odometer below the vehicle initial odometer', async () => {
    const result = await sut.execute(
      vehicle.userId,
      makeFuelLogPayload({ vehicleId: vehicle.id, odometerKm: 9_999 })
    )

    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(PayloadError)
    expect(fuelLogRepository.items).toHaveLength(0)
  })

  it('should reject an odometer that conflicts with the other dates', async () => {
    existingLog(12_000, '2026-03-01')

    const result = await sut.execute(
      vehicle.userId,
      makeFuelLogPayload({
        vehicleId: vehicle.id,
        date: new Date('2026-03-15'),
        odometerKm: 11_000
      })
    )

    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(PayloadError)
    expect(fuelLogRepository.items).toHaveLength(1)
  })

  it('should return PayloadError for invalid values', async () => {
    const result = await sut.execute(
      vehicle.userId,
      makeFuelLogPayload({ vehicleId: vehicle.id, liters: 0 })
    )

    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(PayloadError)
  })
})
