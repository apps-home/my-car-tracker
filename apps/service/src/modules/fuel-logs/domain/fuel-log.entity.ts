import { randomUUID } from 'node:crypto'

import { PayloadError } from '@/core/domain/errors/payload-error'
import type { PaymentMethod } from '@/core/domain/payment-method'
import { omitUndefined } from '@/core/utils/omit-undefined'
import { round } from '@/core/utils/round'
import { addDaysUtc, startOfDayUtc } from '@/core/utils/utc-date'
import type { FuelType } from '@/modules/vehicles/domain/fuel-type'

import type { CreateFuelLogPayload } from './dto/fuel-log.payload'
import type { ConsumptionResult } from './fuel-consumption'

export interface FuelLogProps {
  id: string
  vehicleId: string
  userId: string
  date: Date
  odometerKm: number
  fuelType: FuelType
  liters: number
  pricePerLiter: number
  totalCost: number
  reimbursedAmount?: number
  sharedWith?: string | null
  isFullTank: boolean
  gasStationName: string | null
  paymentMethod: PaymentMethod | null
  distanceDrivenKm: number | null
  consumptionKmPerLiter: number | null
  costPerKm: number | null
  notes: string | null
  createdAt: Date
  updatedAt: Date
}

type DerivedField = 'distanceDrivenKm' | 'consumptionKmPerLiter' | 'costPerKm'

export type UpdateFuelLogProps = Partial<
  Omit<
    FuelLogProps,
    'id' | 'vehicleId' | 'userId' | 'createdAt' | 'updatedAt' | DerivedField
  > & {
    reimbursedAmount?: number | null
  }
>

export class FuelLog {
  private _props: Required<FuelLogProps>

  constructor(props: FuelLogProps) {
    this._props = {
      ...props,
      reimbursedAmount: props.reimbursedAmount ?? 0,
      sharedWith: props.sharedWith ?? null
    }
  }

  static create(userId: string, data: CreateFuelLogPayload): FuelLog {
    const now = new Date()

    return new FuelLog(
      FuelLog.normalize({
        id: randomUUID(),
        vehicleId: data.vehicleId,
        userId,
        date: data.date,
        odometerKm: data.odometerKm,
        fuelType: data.fuelType,
        liters: data.liters,
        pricePerLiter: data.pricePerLiter,
        totalCost: data.totalCost ?? data.liters * data.pricePerLiter,
        reimbursedAmount: data.reimbursedAmount ?? 0,
        sharedWith: data.sharedWith ?? null,
        isFullTank: data.isFullTank ?? true,
        gasStationName: data.gasStationName ?? null,
        paymentMethod: data.paymentMethod ?? null,
        distanceDrivenKm: null,
        consumptionKmPerLiter: null,
        costPerKm: null,
        notes: data.notes ?? null,
        createdAt: now,
        updatedAt: now
      })
    )
  }

  /**
   * Mudar litros ou preço sem informar o total recalcula o total;
   * informar o total mantém o valor pago na bomba.
   */
  update(data: UpdateFuelLogProps): void {
    const changes = omitUndefined(data)
    const next = {
      ...this._props,
      ...changes,
      reimbursedAmount:
        changes.reimbursedAmount === null
          ? 0
          : (changes.reimbursedAmount ?? this._props.reimbursedAmount)
    }

    if (
      changes.totalCost === undefined &&
      (changes.liters !== undefined || changes.pricePerLiter !== undefined)
    ) {
      next.totalCost = next.liters * next.pricePerLiter
    }

    this._props = FuelLog.normalize({ ...next, updatedAt: new Date() })
  }

  /** Grava o resultado do motor de consumo. Devolve `true` quando algo mudou */
  applyConsumption(result: ConsumptionResult): boolean {
    const changed =
      this._props.distanceDrivenKm !== result.distanceDrivenKm ||
      this._props.consumptionKmPerLiter !== result.consumptionKmPerLiter ||
      this._props.costPerKm !== result.costPerKm

    if (changed) {
      this._props = {
        ...this._props,
        distanceDrivenKm: result.distanceDrivenKm,
        consumptionKmPerLiter: result.consumptionKmPerLiter,
        costPerKm: result.costPerKm,
        updatedAt: new Date()
      }
    }

    return changed
  }

  private static normalize(props: FuelLogProps): Required<FuelLogProps> {
    if (!(props.date instanceof Date) || Number.isNaN(props.date.getTime())) {
      throw new PayloadError('date must be a valid date')
    }

    // A data é o dia de calendário (00:00 UTC); um dia de folga cobre o fuso do celular
    const date = startOfDayUtc(props.date)

    if (date > addDaysUtc(startOfDayUtc(new Date()), 1)) {
      throw new PayloadError('date must not be in the future')
    }

    if (
      props.odometerKm === null ||
      !Number.isInteger(props.odometerKm) ||
      props.odometerKm < 0
    ) {
      throw new PayloadError('odometerKm must be a non-negative integer')
    }

    if (props.fuelType === null) {
      throw new PayloadError('fuelType must not be empty')
    }

    const liters = positive(props.liters, 3, 'liters')
    const pricePerLiter = positive(props.pricePerLiter, 3, 'pricePerLiter')
    const totalCost = positive(props.totalCost, 2, 'totalCost')
    const rawReimbursed = props.reimbursedAmount ?? 0

    if (!Number.isFinite(rawReimbursed) || round(rawReimbursed, 2) < 0) {
      throw new PayloadError('reimbursedAmount must not be negative')
    }

    const reimbursedAmount = round(rawReimbursed, 2)

    if (reimbursedAmount > totalCost) {
      throw new PayloadError('reimbursedAmount must not exceed totalCost')
    }

    if (typeof props.isFullTank !== 'boolean') {
      throw new PayloadError('isFullTank must be a boolean')
    }

    return {
      ...props,
      date,
      liters,
      pricePerLiter,
      totalCost,
      reimbursedAmount,
      sharedWith: props.sharedWith?.trim() || null,
      gasStationName: props.gasStationName?.trim() || null,
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

  get date(): Date {
    return this._props.date
  }

  get odometerKm(): number {
    return this._props.odometerKm
  }

  get fuelType(): FuelType {
    return this._props.fuelType
  }

  get liters(): number {
    return this._props.liters
  }

  get pricePerLiter(): number {
    return this._props.pricePerLiter
  }

  get totalCost(): number {
    return this._props.totalCost
  }

  get reimbursedAmount(): number {
    return this._props.reimbursedAmount
  }

  get sharedWith(): string | null {
    return this._props.sharedWith
  }

  /** Valor líquido que saiu do bolso do usuário (`totalCost - reimbursedAmount`) */
  get netCost(): number {
    return round(
      Math.max(0, this._props.totalCost - this._props.reimbursedAmount),
      2
    )
  }

  get isFullTank(): boolean {
    return this._props.isFullTank
  }

  get gasStationName(): string | null {
    return this._props.gasStationName
  }

  get paymentMethod(): PaymentMethod | null {
    return this._props.paymentMethod
  }

  get distanceDrivenKm(): number | null {
    return this._props.distanceDrivenKm
  }

  get consumptionKmPerLiter(): number | null {
    return this._props.consumptionKmPerLiter
  }

  get costPerKm(): number | null {
    return this._props.costPerKm
  }

  get notes(): string | null {
    return this._props.notes
  }

  get createdAt(): Date {
    return this._props.createdAt
  }

  get updatedAt(): Date {
    return this._props.updatedAt
  }
}

function positive(value: number | null, digits: number, field: string) {
  if (value === null || !Number.isFinite(value) || round(value, digits) <= 0) {
    throw new PayloadError(`${field} must be greater than zero`)
  }

  return round(value, digits)
}
