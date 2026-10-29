import { randomUUID } from 'node:crypto'

import { PayloadError } from '@/core/domain/errors/payload-error'
import { omitUndefined } from '@/core/utils/omit-undefined'
import { round } from '@/core/utils/round'
import { addDaysUtc, addMonthsUtc, startOfDayUtc } from '@/core/utils/utc-date'

import type {
  CreateMaintenancePayload,
  MaintenanceItemPayload
} from './dto/maintenance.payload'
import type { MaintenanceType } from './maintenance-type'

export interface MaintenanceItemProps {
  id: string
  scheduleId: string | null
  name: string
  brand: string | null
  partNumber: string | null
  quantity: number
  unitPrice: number
  totalPrice: number
  warrantyMonths: number | null
  warrantyUntil: Date | null
}

export interface MaintenanceProps {
  id: string
  vehicleId: string
  userId: string
  type: MaintenanceType
  title: string
  date: Date
  odometerKm: number
  workshopName: string | null
  laborCost: number
  partsCost: number
  totalAmount: number
  /** Chave do arquivo no R2 (pasta privada), não uma URL pública */
  invoiceUrl: string | null
  notes: string | null
  items: MaintenanceItemProps[]
  createdAt: Date
  updatedAt: Date
}

type EditableFields = Omit<
  MaintenanceProps,
  | 'id'
  | 'vehicleId'
  | 'userId'
  | 'items'
  | 'partsCost'
  | 'totalAmount'
  | 'invoiceUrl'
  | 'createdAt'
  | 'updatedAt'
>

export type UpdateMaintenanceProps = Partial<EditableFields> & {
  partsCost?: number
  totalAmount?: number
  items?: MaintenanceItemPayload[]
}

/** Execução registrada (data e km) usada para renovar planos */
export interface MaintenanceExecution {
  date: Date
  odometerKm: number
}

export class Maintenance {
  private _props: MaintenanceProps

  constructor(props: MaintenanceProps) {
    this._props = props
  }

  static create(userId: string, data: CreateMaintenancePayload): Maintenance {
    const now = new Date()
    const items = (data.items ?? []).map((item) => Maintenance.buildItem(item))

    return new Maintenance(
      Maintenance.normalize(
        {
          id: randomUUID(),
          vehicleId: data.vehicleId,
          userId,
          type: data.type ?? 'PREVENTIVE',
          title: data.title,
          date: data.date,
          odometerKm: data.odometerKm,
          workshopName: data.workshopName ?? null,
          laborCost: data.laborCost ?? 0,
          partsCost: data.partsCost ?? 0,
          totalAmount: 0,
          invoiceUrl: null,
          notes: data.notes ?? null,
          items,
          createdAt: now,
          updatedAt: now
        },
        data.totalAmount
      )
    )
  }

  /**
   * Total informado vira valor fechado. Sem total, um registro que estava
   * calculado (mão de obra + peças) continua calculado.
   */
  update({ items, totalAmount, ...data }: UpdateMaintenanceProps): void {
    const previous = this._props
    const wasCalculated =
      round(previous.laborCost + previous.partsCost, 2) === previous.totalAmount

    this._props = Maintenance.normalize(
      {
        ...previous,
        ...omitUndefined(data),
        items: items
          ? items.map((item) => Maintenance.buildItem(item))
          : previous.items,
        updatedAt: new Date()
      },
      totalAmount ?? (wasCalculated ? undefined : previous.totalAmount)
    )
  }

  attachInvoice(key: string | null): void {
    this._props = { ...this._props, invoiceUrl: key, updatedAt: new Date() }
  }

  /** Planos cumpridos por algum item */
  get scheduleIds(): string[] {
    return [
      ...new Set(
        this._props.items
          .map((item) => item.scheduleId)
          .filter((id): id is string => !!id)
      )
    ]
  }

  get execution(): MaintenanceExecution {
    return { date: this._props.date, odometerKm: this._props.odometerKm }
  }

  private static buildItem(data: MaintenanceItemPayload): MaintenanceItemProps {
    return {
      id: randomUUID(),
      scheduleId: data.scheduleId ?? null,
      name: data.name,
      brand: data.brand ?? null,
      partNumber: data.partNumber ?? null,
      quantity: data.quantity ?? 1,
      unitPrice: data.unitPrice,
      totalPrice:
        data.totalPrice ?? (data.quantity ?? 1) * (data.unitPrice ?? 0),
      warrantyMonths: data.warrantyMonths ?? null,
      warrantyUntil: null
    }
  }

  private static normalize(
    props: MaintenanceProps,
    fixedTotal?: number
  ): MaintenanceProps {
    if (!(props.date instanceof Date) || Number.isNaN(props.date.getTime())) {
      throw new PayloadError('date must be a valid date')
    }

    const date = startOfDayUtc(props.date)

    if (date > addDaysUtc(startOfDayUtc(new Date()), 1)) {
      throw new PayloadError('date must not be in the future')
    }

    const title = props.title?.trim()

    if (!title) {
      throw new PayloadError('title must not be empty')
    }

    if (!props.type) {
      throw new PayloadError('type must not be empty')
    }

    if (
      props.odometerKm === null ||
      !Number.isInteger(props.odometerKm) ||
      props.odometerKm < 0
    ) {
      throw new PayloadError('odometerKm must be a non-negative integer')
    }

    const laborCost = money(props.laborCost, 'laborCost')

    const items = props.items.map((item, index) => {
      const name = item.name?.trim()

      if (!name) {
        throw new PayloadError(`items[${index}].name must not be empty`)
      }

      if (
        item.quantity === null ||
        !Number.isFinite(item.quantity) ||
        round(item.quantity, 2) <= 0
      ) {
        throw new PayloadError(
          `items[${index}].quantity must be greater than zero`
        )
      }

      if (
        item.warrantyMonths !== null &&
        (!Number.isInteger(item.warrantyMonths) || item.warrantyMonths <= 0)
      ) {
        throw new PayloadError(
          `items[${index}].warrantyMonths must be a positive integer`
        )
      }

      return {
        ...item,
        name,
        brand: item.brand?.trim() || null,
        partNumber: item.partNumber?.trim() || null,
        quantity: round(item.quantity, 2),
        unitPrice: money(item.unitPrice, `items[${index}].unitPrice`),
        totalPrice: money(item.totalPrice, `items[${index}].totalPrice`),
        warrantyUntil: item.warrantyMonths
          ? addMonthsUtc(date, item.warrantyMonths)
          : null
      }
    })

    const partsCost = items.length
      ? round(
          items.reduce((sum, item) => sum + item.totalPrice, 0),
          2
        )
      : money(props.partsCost, 'partsCost')

    const totalAmount =
      fixedTotal !== undefined
        ? money(fixedTotal, 'totalAmount')
        : round(laborCost + partsCost, 2)

    return {
      ...props,
      title,
      date,
      laborCost,
      partsCost,
      totalAmount,
      items,
      workshopName: props.workshopName?.trim() || null,
      notes: props.notes?.trim() || null
    }
  }

  get id(): string {
    return this._props.id
  }

  get vehicleId(): string {
    return this._props.vehicleId
  }

  get userId(): string {
    return this._props.userId
  }

  get type(): MaintenanceType {
    return this._props.type
  }

  get title(): string {
    return this._props.title
  }

  get date(): Date {
    return this._props.date
  }

  get odometerKm(): number {
    return this._props.odometerKm
  }

  get workshopName(): string | null {
    return this._props.workshopName
  }

  get laborCost(): number {
    return this._props.laborCost
  }

  get partsCost(): number {
    return this._props.partsCost
  }

  get totalAmount(): number {
    return this._props.totalAmount
  }

  get invoiceUrl(): string | null {
    return this._props.invoiceUrl
  }

  get notes(): string | null {
    return this._props.notes
  }

  get items(): MaintenanceItemProps[] {
    return this._props.items
  }

  get createdAt(): Date {
    return this._props.createdAt
  }

  get updatedAt(): Date {
    return this._props.updatedAt
  }
}

function money(value: number | null, field: string): number {
  if (value === null || !Number.isFinite(value) || value < 0) {
    throw new PayloadError(`${field} must be zero or greater`)
  }

  return round(value, 2)
}
