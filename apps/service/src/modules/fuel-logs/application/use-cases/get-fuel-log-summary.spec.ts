import { faker } from '@faker-js/faker'
import { makeFuelLog } from '@test/factories/make-fuel-log'
import { makeVehicle } from '@test/factories/make-vehicle'
import { InMemoryFuelLogRepository } from '@test/repositories/in-memory-fuel-log.repository'
import { InMemoryVehicleRepository } from '@test/repositories/in-memory-vehicle.repository'
import { beforeEach, describe, expect, it } from 'vitest'

import { VehicleNotFoundError } from '@/modules/vehicles/application/errors/vehicle-not-found.error'
import type { FuelType } from '@/modules/vehicles/domain/fuel-type'
import type { Vehicle } from '@/modules/vehicles/domain/vehicle.entity'

import { GetFuelLogSummaryUseCase } from './get-fuel-log-summary'

describe('GetFuelLogSummaryUseCase', () => {
  let fuelLogRepository: InMemoryFuelLogRepository
  let vehicleRepository: InMemoryVehicleRepository
  let sut: GetFuelLogSummaryUseCase
  let vehicle: Vehicle

  beforeEach(() => {
    fuelLogRepository = new InMemoryFuelLogRepository()
    vehicleRepository = new InMemoryVehicleRepository()
    sut = new GetFuelLogSummaryUseCase(fuelLogRepository, vehicleRepository)

    vehicle = makeVehicle()
    vehicleRepository.items.push(vehicle)
  })

  function existingLog(
    odometerKm: number,
    date: string,
    fuelType: FuelType,
    liters: number,
    pricePerLiter: number
  ) {
    fuelLogRepository.items.push(
      makeFuelLog({
        vehicleId: vehicle.id,
        userId: vehicle.userId,
        odometerKm,
        date: new Date(date),
        fuelType,
        liters,
        pricePerLiter,
        totalCost: liters * pricePerLiter
      })
    )
  }

  it('should summarize the period by fuel type with the real ethanol parity', async () => {
    // Fora do período: abre o primeiro período de consumo
    existingLog(10_000, '2026-02-25', 'GASOLINE_COMMON', 40, 6)
    existingLog(10_480, '2026-03-05', 'GASOLINE_COMMON', 40, 6) // 12 km/L
    existingLog(10_800, '2026-03-15', 'ETHANOL', 40, 4) // 8 km/L

    const result = await sut.execute({
      userId: vehicle.userId,
      vehicleId: vehicle.id,
      year: 2026,
      month: 3
    })

    expect(result.isRight()).toBe(true)
    if (result.isRight()) {
      const summary = result.value

      expect(summary.count).toBe(2)
      expect(summary.totalLiters).toBe(80)
      expect(summary.totalCost).toBe(400)
      expect(summary.averagePricePerLiter).toBe(5)
      expect(summary.distanceKm).toBe(800)
      expect(summary.consumptionKmPerLiter).toBe(10)
      expect(summary.costPerKm).toBe(0.5)
      expect(summary.ethanolParity).toBe(0.667)

      const ethanol = summary.byFuelType.find(
        ({ fuelType }) => fuelType === 'ETHANOL'
      )
      expect(ethanol).toMatchObject({
        count: 1,
        consumptionKmPerLiter: 8,
        costPerKm: 0.5,
        lastPricePerLiter: 4
      })
    }
  })

  it('should return an empty summary without fuel logs', async () => {
    const result = await sut.execute({
      userId: vehicle.userId,
      vehicleId: vehicle.id
    })

    expect(result.isRight()).toBe(true)
    if (result.isRight()) {
      expect(result.value).toMatchObject({
        count: 0,
        consumptionKmPerLiter: null,
        byFuelType: [],
        ethanolParity: null
      })
    }
  })

  it('should not summarize the vehicle of another user', async () => {
    const result = await sut.execute({
      userId: faker.string.alphanumeric(32),
      vehicleId: vehicle.id
    })

    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(VehicleNotFoundError)
  })
})
