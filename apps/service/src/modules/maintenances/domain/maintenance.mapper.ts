import type {
  Maintenance,
  MaintenanceItemProps,
  MaintenanceProps
} from './maintenance.entity'

export type MaintenanceHTTP = Omit<
  MaintenanceProps,
  'userId' | 'invoiceUrl'
> & {
  /** A nota é baixada por `GET /maintenances/:id/invoice` (link assinado) */
  hasInvoice: boolean
}

export class MaintenanceMapper {
  static toHTTP(maintenance: Maintenance): MaintenanceHTTP {
    const { userId, invoiceUrl, ...props } =
      MaintenanceMapper.toProps(maintenance)

    return { ...props, hasInvoice: !!invoiceUrl }
  }

  static toProps(maintenance: Maintenance): MaintenanceProps {
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
      items: maintenance.items.map((item: MaintenanceItemProps) => ({
        ...item
      })),
      createdAt: maintenance.createdAt,
      updatedAt: maintenance.updatedAt
    }
  }
}
