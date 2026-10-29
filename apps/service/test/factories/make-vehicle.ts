import { faker } from '@faker-js/faker'

import type { CreateVehiclePayload } from '@/modules/vehicles/domain/dto/vehicle.payload'
import { FUEL_TYPES } from '@/modules/vehicles/domain/fuel-type'
import {
  Vehicle,
  type VehicleProps
} from '@/modules/vehicles/domain/vehicle.entity'

export function makeLicensePlate(): string {
  return `${faker.string.alpha({ length: 3, casing: 'upper' })}${faker.string.numeric()}${faker.string.alpha({ length: 1, casing: 'upper' })}${faker.string.numeric(2)}`
}

export function makeVehiclePayload(
  override: Partial<CreateVehiclePayload> = {}
): CreateVehiclePayload {
  const modelYear = faker.number.int({ min: 2010, max: 2026 })

  return {
    name: faker.vehicle.model(),
    brand: faker.vehicle.manufacturer(),
    model: faker.vehicle.model(),
    modelYear,
    manufactureYear: modelYear - faker.number.int({ min: 0, max: 1 }),
    licensePlate: makeLicensePlate(),
    color: faker.vehicle.color(),
    initialOdometerKm: faker.number.int({ min: 0, max: 100_000 }),
    fuelTankCapacityLiters: faker.number.int({ min: 40, max: 70 }),
    defaultFuelType: faker.helpers.arrayElement(FUEL_TYPES),
    ...override
  }
}

export function makeVehicle(override: Partial<VehicleProps> = {}): Vehicle {
  const initialOdometerKm = faker.number.int({ min: 0, max: 100_000 })

  return new Vehicle({
    id: faker.string.uuid(),
    userId: faker.string.alphanumeric(32),
    name: faker.vehicle.model(),
    brand: faker.vehicle.manufacturer(),
    model: faker.vehicle.model(),
    modelYear: faker.number.int({ min: 2010, max: 2026 }),
    manufactureYear: null,
    licensePlate: null,
    color: faker.vehicle.color(),
    initialOdometerKm,
    currentOdometerKm:
      initialOdometerKm + faker.number.int({ min: 0, max: 50_000 }),
    fuelTankCapacityLiters: faker.number.int({ min: 40, max: 70 }),
    defaultFuelType: 'GASOLINE_COMMON',
    photoUrl: null,
    isActive: true,
    notes: null,
    createdAt: faker.date.past(),
    updatedAt: faker.date.recent(),
    ...override
  })
}
