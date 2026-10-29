import { faker } from '@faker-js/faker'

import { PAYMENT_METHODS } from '@/core/domain/payment-method'
import { startOfDayUtc } from '@/core/utils/utc-date'
import type { CreateFuelLogPayload } from '@/modules/fuel-logs/domain/dto/fuel-log.payload'
import {
  FuelLog,
  type FuelLogProps
} from '@/modules/fuel-logs/domain/fuel-log.entity'
import { FUEL_TYPES } from '@/modules/vehicles/domain/fuel-type'

export function makeFuelLogPayload(
  override: Partial<CreateFuelLogPayload> = {}
): CreateFuelLogPayload {
  return {
    vehicleId: faker.string.uuid(),
    date: startOfDayUtc(faker.date.recent({ days: 30 })),
    odometerKm: faker.number.int({ min: 1_000, max: 100_000 }),
    fuelType: faker.helpers.arrayElement(FUEL_TYPES),
    liters: faker.number.float({ min: 10, max: 50, fractionDigits: 3 }),
    pricePerLiter: faker.number.float({ min: 4, max: 7, fractionDigits: 3 }),
    isFullTank: true,
    gasStationName: faker.company.name(),
    paymentMethod: faker.helpers.arrayElement(PAYMENT_METHODS),
    ...override
  }
}

export function makeFuelLog(override: Partial<FuelLogProps> = {}): FuelLog {
  const liters = faker.number.float({ min: 10, max: 50, fractionDigits: 3 })
  const pricePerLiter = faker.number.float({
    min: 4,
    max: 7,
    fractionDigits: 3
  })

  return new FuelLog({
    id: faker.string.uuid(),
    vehicleId: faker.string.uuid(),
    userId: faker.string.alphanumeric(32),
    date: startOfDayUtc(faker.date.recent({ days: 30 })),
    odometerKm: faker.number.int({ min: 1_000, max: 100_000 }),
    fuelType: faker.helpers.arrayElement(FUEL_TYPES),
    liters,
    pricePerLiter,
    totalCost: Math.round(liters * pricePerLiter * 100) / 100,
    reimbursedAmount: 0,
    sharedWith: null,
    isFullTank: true,
    gasStationName: null,
    paymentMethod: null,
    distanceDrivenKm: null,
    consumptionKmPerLiter: null,
    costPerKm: null,
    notes: null,
    createdAt: faker.date.past(),
    updatedAt: faker.date.recent(),
    ...override
  })
}
