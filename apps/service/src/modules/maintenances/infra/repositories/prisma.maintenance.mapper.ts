import type { Prisma } from '@lib/my-car-tracker-db'

import { Maintenance } from '../../domain/maintenance.entity'

export const MAINTENANCE_INCLUDE = {
  items: { orderBy: { totalPrice: 'desc' } }
} as const satisfies Prisma.MaintenanceRecordInclude

type RawMaintenance = Prisma.MaintenanceRecordGetPayload<{
  include: typeof MAINTENANCE_INCLUDE
}>

export class PrismaMaintenanceMapper {
  static toDomain(raw: RawMaintenance): Maintenance {
    return new Maintenance({
      id: raw.id,
      vehicleId: raw.vehicleId,
      userId: raw.userId,
      type: raw.type,
      title: raw.title,
      date: raw.date,
      odometerKm: raw.odometerKm,
      workshopName: raw.workshopName,
      laborCost: raw.laborCost.toNumber(),
      partsCost: raw.partsCost.toNumber(),
      totalAmount: raw.totalAmount.toNumber(),
      invoiceUrl: raw.invoiceUrl,
      notes: raw.notes,
      items: raw.items.map((item) => ({
        id: item.id,
        scheduleId: item.scheduleId,
        name: item.name,
        brand: item.brand,
        partNumber: item.partNumber,
        quantity: item.quantity.toNumber(),
        unitPrice: item.unitPrice.toNumber(),
        totalPrice: item.totalPrice.toNumber(),
        warrantyMonths: item.warrantyMonths,
        warrantyUntil: item.warrantyUntil
      })),
      createdAt: raw.createdAt,
      updatedAt: raw.updatedAt
    })
  }

  static toPrismaRecord(
    maintenance: Maintenance
  ): Prisma.MaintenanceRecordUncheckedCreateWithoutItemsInput {
    return {
      id: maintenance.id,
      vehicleId: maintenance.vehicleId,
      userId: maintenance.userId,
      type: maintenance.type,
      title: maintenance.title,
      date: maintenance.date,
      odometerKm: maintenance.odometerKm,
      workshopName: maintenance.workshopName,
      laborCost: maintenance.laborCost,
      partsCost: maintenance.partsCost,
      totalAmount: maintenance.totalAmount,
      invoiceUrl: maintenance.invoiceUrl,
      notes: maintenance.notes,
      createdAt: maintenance.createdAt,
      updatedAt: maintenance.updatedAt
    }
  }

  static toPrismaItems(
    maintenance: Maintenance
  ): Prisma.MaintenanceItemCreateManyInput[] {
    return maintenance.items.map((item) => ({
      ...item,
      maintenanceRecordId: maintenance.id
    }))
  }
}
