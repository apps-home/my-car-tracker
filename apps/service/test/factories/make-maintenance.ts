import { faker } from '@faker-js/faker'

import { startOfDayUtc } from '@/core/utils/utc-date'
import type {
  CreateMaintenancePayload,
  MaintenanceItemPayload
} from '@/modules/maintenances/domain/dto/maintenance.payload'
import { Maintenance } from '@/modules/maintenances/domain/maintenance.entity'

export function makeMaintenanceItemPayload(
  override: Partial<MaintenanceItemPayload> = {}
): MaintenanceItemPayload {
  return {
    name: faker.commerce.productName(),
    brand: faker.company.name(),
    quantity: 1,
    unitPrice: faker.number.float({ min: 20, max: 500, fractionDigits: 2 }),
    ...override
  }
}

export function makeMaintenancePayload(
  override: Partial<CreateMaintenancePayload> = {}
): CreateMaintenancePayload {
  return {
    vehicleId: faker.string.uuid(),
    type: 'PREVENTIVE',
    title: `Revisão ${faker.number.int({ min: 1, max: 9 })}0.000 km`,
    date: startOfDayUtc(faker.date.recent({ days: 30 })),
    odometerKm: faker.number.int({ min: 10_000, max: 80_000 }),
    workshopName: faker.company.name(),
    laborCost: faker.number.float({ min: 50, max: 400, fractionDigits: 2 }),
    items: [makeMaintenanceItemPayload()],
    ...override
  }
}

/** Manutenção criada pela própria entidade (itens e totais calculados) */
export function makeMaintenance(
  userId: string = faker.string.alphanumeric(32),
  override: Partial<CreateMaintenancePayload> = {}
): Maintenance {
  return Maintenance.create(userId, makeMaintenancePayload(override))
}
