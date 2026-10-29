import { randomUUID } from 'node:crypto'

import { PayloadError } from '@/core/domain/errors/payload-error'
import { omitUndefined } from '@/core/utils/omit-undefined'

import type { CreateVehiclePayload } from './dto/vehicle.payload'
import type { FuelType } from './fuel-type'

export interface VehicleProps {
  id: string
  userId: string
  name: string
  brand: string
  model: string
  modelYear: number
  manufactureYear: number | null
  licensePlate: string | null
  color: string | null
  currentOdometerKm: number
  initialOdometerKm: number
  fuelTankCapacityLiters: number | null
  defaultFuelType: FuelType
  photoUrl: string | null
  isActive: boolean
  notes: string | null
  createdAt: Date
  updatedAt: Date
}

export type UpdateVehicleProps = Partial<
  Omit<VehicleProps, 'id' | 'userId' | 'createdAt' | 'updatedAt'>
>

/** Placa antiga (ABC1234) ou Mercosul (ABC1D23), já sem hífen e em maiúsculas */
const LICENSE_PLATE_REGEX = /^[A-Z]{3}\d[A-Z\d]\d{2}$/

const MIN_MODEL_YEAR = 1900

export class Vehicle {
  private _props: VehicleProps

  constructor(props: VehicleProps) {
    this._props = props
  }

  static create(userId: string, data: CreateVehiclePayload): Vehicle {
    const now = new Date()

    return new Vehicle(
      Vehicle.normalize({
        id: randomUUID(),
        userId,
        name: data.name,
        brand: data.brand,
        model: data.model,
        modelYear: data.modelYear,
        manufactureYear: data.manufactureYear ?? null,
        licensePlate: data.licensePlate ?? null,
        color: data.color ?? null,
        initialOdometerKm: data.initialOdometerKm,
        currentOdometerKm: data.currentOdometerKm ?? data.initialOdometerKm,
        fuelTankCapacityLiters: data.fuelTankCapacityLiters ?? null,
        defaultFuelType: data.defaultFuelType ?? 'GASOLINE_COMMON',
        photoUrl: null,
        isActive: true,
        notes: data.notes ?? null,
        createdAt: now,
        updatedAt: now
      })
    )
  }

  update(data: UpdateVehicleProps): void {
    this._props = Vehicle.normalize({
      ...this._props,
      ...omitUndefined(data),
      updatedAt: new Date()
    })
  }

  /**
   * Avança o odômetro quando um lançamento traz km maior que o atual.
   * Devolve `true` quando o valor mudou (quem chama emite `vehicle.odometer-updated`).
   */
  syncOdometer(odometerKm: number): boolean {
    if (odometerKm <= this._props.currentOdometerKm) {
      return false
    }

    this.update({ currentOdometerKm: odometerKm })

    return true
  }

  private static normalize(props: VehicleProps): VehicleProps {
    const normalized: VehicleProps = {
      ...props,
      name: requiredText(props.name, 'name'),
      brand: requiredText(props.brand, 'brand'),
      model: requiredText(props.model, 'model'),
      licensePlate: normalizeLicensePlate(props.licensePlate),
      color: optionalText(props.color),
      notes: optionalText(props.notes)
    }

    const maxModelYear = new Date().getUTCFullYear() + 1

    if (
      !Number.isInteger(normalized.modelYear) ||
      normalized.modelYear < MIN_MODEL_YEAR ||
      normalized.modelYear > maxModelYear
    ) {
      throw new PayloadError(
        `modelYear must be between ${MIN_MODEL_YEAR} and ${maxModelYear}`
      )
    }

    if (
      normalized.manufactureYear !== null &&
      (!Number.isInteger(normalized.manufactureYear) ||
        normalized.manufactureYear < MIN_MODEL_YEAR ||
        normalized.manufactureYear > normalized.modelYear)
    ) {
      throw new PayloadError('manufactureYear must not be after modelYear')
    }

    requiredNonNegativeInteger(
      normalized.initialOdometerKm,
      'initialOdometerKm'
    )
    requiredNonNegativeInteger(
      normalized.currentOdometerKm,
      'currentOdometerKm'
    )

    if (normalized.currentOdometerKm < normalized.initialOdometerKm) {
      throw new PayloadError(
        'currentOdometerKm must not be lower than initialOdometerKm'
      )
    }

    if (
      normalized.fuelTankCapacityLiters !== null &&
      (!Number.isInteger(normalized.fuelTankCapacityLiters) ||
        normalized.fuelTankCapacityLiters <= 0)
    ) {
      throw new PayloadError(
        'fuelTankCapacityLiters must be a positive integer'
      )
    }

    if (normalized.defaultFuelType === null) {
      throw new PayloadError('defaultFuelType must not be empty')
    }

    if (typeof normalized.isActive !== 'boolean') {
      throw new PayloadError('isActive must be a boolean')
    }

    return normalized
  }

  get id(): string {
    return this._props.id
  }

  get userId(): string {
    return this._props.userId
  }

  get name(): string {
    return this._props.name
  }

  get brand(): string {
    return this._props.brand
  }

  get model(): string {
    return this._props.model
  }

  get modelYear(): number {
    return this._props.modelYear
  }

  get manufactureYear(): number | null {
    return this._props.manufactureYear
  }

  get licensePlate(): string | null {
    return this._props.licensePlate
  }

  get color(): string | null {
    return this._props.color
  }

  get currentOdometerKm(): number {
    return this._props.currentOdometerKm
  }

  get initialOdometerKm(): number {
    return this._props.initialOdometerKm
  }

  get fuelTankCapacityLiters(): number | null {
    return this._props.fuelTankCapacityLiters
  }

  get defaultFuelType(): FuelType {
    return this._props.defaultFuelType
  }

  get photoUrl(): string | null {
    return this._props.photoUrl
  }

  get isActive(): boolean {
    return this._props.isActive
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

function requiredText(value: string | null, field: string): string {
  const trimmed = value?.trim()

  if (!trimmed) {
    throw new PayloadError(`${field} must not be empty`)
  }

  return trimmed
}

function optionalText(value: string | null): string | null {
  return value?.trim() || null
}

function requiredNonNegativeInteger(value: number | null, field: string) {
  if (value === null || !Number.isInteger(value) || value < 0) {
    throw new PayloadError(`${field} must be a non-negative integer`)
  }
}

function normalizeLicensePlate(value: string | null): string | null {
  const plate = value?.replace(/[\s-]/g, '').toUpperCase()

  if (!plate) {
    return null
  }

  if (!LICENSE_PLATE_REGEX.test(plate)) {
    throw new PayloadError('licensePlate must be a valid Brazilian plate')
  }

  return plate
}
