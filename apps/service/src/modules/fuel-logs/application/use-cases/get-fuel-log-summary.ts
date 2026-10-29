import { Injectable } from '@nestjs/common'

import { isInDateRange, toDateRange } from '@/core/utils/date-range'
import { Either, left, right } from '@/core/utils/Either'
import { round } from '@/core/utils/round'
import { VehicleNotFoundError } from '@/modules/vehicles/application/errors/vehicle-not-found.error'
import type { FuelType } from '@/modules/vehicles/domain/fuel-type'
import { VehicleRepository } from '@/modules/vehicles/domain/vehicle.repository'

import type { FuelLogSummaryParams } from '../../domain/dto/fuel-log.payload'
import {
  type ConsumptionResult,
  calculateConsumption
} from '../../domain/fuel-consumption'
import type { FuelLog } from '../../domain/fuel-log.entity'
import { FuelLogRepository } from '../../domain/fuel-log.repository'

export interface FuelTotals {
  count: number
  totalLiters: number
  totalCost: number
  averagePricePerLiter: number | null
  /** Km dos períodos fechados por tanque cheio */
  distanceKm: number
  consumptionKmPerLiter: number | null
  costPerKm: number | null
}

export interface FuelTypeSummary extends FuelTotals {
  fuelType: FuelType
  /** Preço do abastecimento mais recente desse combustível no período */
  lastPricePerLiter: number
}

export interface FuelLogSummary extends FuelTotals {
  vehicleId: string
  byFuelType: FuelTypeSummary[]
  /**
   * Paridade real do carro (km/L no etanol ÷ km/L na gasolina).
   * Etanol compensa quando o preço dele ÷ o da gasolina fica abaixo desse valor.
   */
  ethanolParity: number | null
}

type Response = Either<VehicleNotFoundError, FuelLogSummary>

interface Entry {
  fuelLog: FuelLog
  consumption: ConsumptionResult
}

const GASOLINE_TYPES: FuelType[] = [
  'GASOLINE_COMMON',
  'GASOLINE_ADDITIVE',
  'GASOLINE_PREMIUM'
]

@Injectable()
export class GetFuelLogSummaryUseCase {
  constructor(
    private fuelLogRepository: FuelLogRepository,
    private vehicleRepository: VehicleRepository
  ) {}

  async execute({
    userId,
    vehicleId,
    ...period
  }: FuelLogSummaryParams): Promise<Response> {
    const vehicle = await this.vehicleRepository.findById(vehicleId, userId)

    if (!vehicle) {
      return left(new VehicleNotFoundError())
    }

    // O consumo depende dos registros anteriores ao período, então o motor roda sobre todos
    const fuelLogs = await this.fuelLogRepository.findAllByVehicle(
      vehicleId,
      userId
    )
    const consumption = calculateConsumption(fuelLogs)
    const range = toDateRange(period)

    const entries: Entry[] = fuelLogs
      .filter((fuelLog) => isInDateRange(fuelLog.date, range))
      .map((fuelLog) => ({
        fuelLog,
        consumption: consumption.get(fuelLog.id) as ConsumptionResult
      }))

    const fuelTypes = [
      ...new Set(entries.map(({ fuelLog }) => fuelLog.fuelType))
    ]

    const byFuelType = fuelTypes.map((fuelType): FuelTypeSummary => {
      const ofType = entries.filter(
        ({ fuelLog }) => fuelLog.fuelType === fuelType
      )
      const latest = ofType.reduce((a, b) =>
        b.fuelLog.date > a.fuelLog.date ? b : a
      )

      return {
        fuelType,
        ...totals(ofType),
        lastPricePerLiter: latest.fuelLog.pricePerLiter
      }
    })

    return right({
      vehicleId,
      ...totals(entries),
      byFuelType,
      ethanolParity: ethanolParity(entries)
    })
  }
}

/** Período atribuído ao combustível do tanque cheio que o fecha */
function totals(entries: Entry[]): FuelTotals {
  let totalLiters = 0
  let totalCost = 0
  let distanceKm = 0
  let periodLiters = 0
  let periodCost = 0

  for (const { fuelLog, consumption } of entries) {
    totalLiters += fuelLog.liters
    totalCost += fuelLog.totalCost

    if (consumption.distanceDrivenKm !== null) {
      distanceKm += consumption.distanceDrivenKm
      periodLiters += consumption.periodLiters ?? 0
      periodCost += consumption.periodCost ?? 0
    }
  }

  return {
    count: entries.length,
    totalLiters: round(totalLiters, 3),
    totalCost: round(totalCost, 2),
    averagePricePerLiter:
      totalLiters > 0 ? round(totalCost / totalLiters, 3) : null,
    distanceKm,
    consumptionKmPerLiter:
      periodLiters > 0 ? round(distanceKm / periodLiters, 2) : null,
    costPerKm: distanceKm > 0 ? round(periodCost / distanceKm, 4) : null
  }
}

function ethanolParity(entries: Entry[]): number | null {
  const ethanol = totals(
    entries.filter(({ fuelLog }) => fuelLog.fuelType === 'ETHANOL')
  ).consumptionKmPerLiter
  const gasoline = totals(
    entries.filter(({ fuelLog }) => GASOLINE_TYPES.includes(fuelLog.fuelType))
  ).consumptionKmPerLiter

  return ethanol && gasoline ? round(ethanol / gasoline, 3) : null
}
