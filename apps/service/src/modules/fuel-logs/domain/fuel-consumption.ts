import { round } from '@/core/utils/round'

/** Dados de um abastecimento que o motor de consumo precisa */
export interface ConsumptionInput {
  id: string
  date: Date
  odometerKm: number
  liters: number
  totalCost: number
  isFullTank: boolean
}

export interface ConsumptionResult {
  distanceDrivenKm: number | null
  consumptionKmPerLiter: number | null
  costPerKm: number | null
  /** Litros do período fechado por este tanque cheio (parciais intermediários incluídos) */
  periodLiters: number | null
  /** Custo do período fechado por este tanque cheio (parciais intermediários incluídos) */
  periodCost: number | null
}

const EMPTY: ConsumptionResult = {
  distanceDrivenKm: null,
  consumptionKmPerLiter: null,
  costPerKm: null,
  periodLiters: null,
  periodCost: null
}

/** Ordem cronológica do veículo: odômetro e, no empate, data */
export function compareByOdometer(
  a: Pick<ConsumptionInput, 'odometerKm' | 'date' | 'id'>,
  b: Pick<ConsumptionInput, 'odometerKm' | 'date' | 'id'>
): number {
  return (
    a.odometerKm - b.odometerKm ||
    a.date.getTime() - b.date.getTime() ||
    a.id.localeCompare(b.id)
  )
}

/**
 * Recalcula o consumo de todos os abastecimentos de um veículo.
 *
 * Um tanque cheio fecha o período iniciado no tanque cheio anterior:
 * distância = odômetro atual - odômetro do tanque cheio anterior, e litros e custo
 * somam os parciais do período mais o próprio abastecimento. Parciais, o primeiro
 * tanque cheio e períodos sem distância ficam sem consumo.
 */
export function calculateConsumption(
  logs: ConsumptionInput[]
): Map<string, ConsumptionResult> {
  const results = new Map<string, ConsumptionResult>()

  let previousFullOdometerKm: number | null = null
  let periodLiters = 0
  let periodCost = 0

  for (const log of [...logs].sort(compareByOdometer)) {
    if (previousFullOdometerKm === null) {
      results.set(log.id, EMPTY)

      if (log.isFullTank) {
        previousFullOdometerKm = log.odometerKm
      }

      continue
    }

    periodLiters += log.liters
    periodCost += log.totalCost

    if (!log.isFullTank) {
      results.set(log.id, EMPTY)
      continue
    }

    const distanceDrivenKm: number = log.odometerKm - previousFullOdometerKm

    results.set(
      log.id,
      distanceDrivenKm > 0
        ? {
            distanceDrivenKm,
            consumptionKmPerLiter: round(distanceDrivenKm / periodLiters, 2),
            costPerKm: round(periodCost / distanceDrivenKm, 4),
            periodLiters: round(periodLiters, 3),
            periodCost: round(periodCost, 2)
          }
        : EMPTY
    )

    previousFullOdometerKm = log.odometerKm
    periodLiters = 0
    periodCost = 0
  }

  return results
}

/**
 * O odômetro precisa crescer com a data: um abastecimento mais antigo não pode ter
 * km maior, nem um mais novo km menor. Devolve o primeiro registro em conflito.
 */
export function findOdometerConflict<
  T extends Pick<ConsumptionInput, 'id' | 'date' | 'odometerKm'>
>(logs: T[], candidate: Pick<T, 'id' | 'date' | 'odometerKm'>): T | null {
  return (
    logs.find(
      (log) =>
        log.id !== candidate.id &&
        ((log.date < candidate.date && log.odometerKm > candidate.odometerKm) ||
          (log.date > candidate.date && log.odometerKm < candidate.odometerKm))
    ) ?? null
  )
}
