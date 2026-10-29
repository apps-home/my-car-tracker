import { faker } from '@faker-js/faker'
import { describe, expect, it } from 'vitest'

import {
  type ConsumptionInput,
  calculateConsumption,
  compareByOdometer
} from './fuel-consumption'

function makeInput(override: Partial<ConsumptionInput>): ConsumptionInput {
  return {
    id: faker.string.uuid(),
    date: faker.date.recent(),
    odometerKm: faker.number.int({ min: 0, max: 100_000 }),
    liters: faker.number.float({ min: 10, max: 50, fractionDigits: 3 }),
    totalCost: faker.number.float({ min: 50, max: 300, fractionDigits: 2 }),
    isFullTank: true,
    ...override
  }
}

describe('calculateConsumption', () => {
  it('should leave the first full tank without consumption', () => {
    const first = makeInput({ odometerKm: 10_000 })

    const results = calculateConsumption([first])

    expect(results.get(first.id)).toEqual({
      distanceDrivenKm: null,
      consumptionKmPerLiter: null,
      costPerKm: null,
      periodLiters: null,
      periodCost: null
    })
  })

  it('should calculate consumption between two full tanks', () => {
    const first = makeInput({ odometerKm: 10_000 })
    const second = makeInput({
      odometerKm: 10_500,
      liters: 40,
      totalCost: 236
    })

    const result = calculateConsumption([second, first]).get(second.id)

    expect(result).toEqual({
      distanceDrivenKm: 500,
      consumptionKmPerLiter: 12.5,
      costPerKm: 0.472,
      periodLiters: 40,
      periodCost: 236
    })
  })

  it('should add partial fills to the period closed by the next full tank', () => {
    const first = makeInput({ odometerKm: 20_000 })
    const partial = makeInput({
      odometerKm: 20_200,
      liters: 10,
      totalCost: 60,
      isFullTank: false
    })
    const full = makeInput({ odometerKm: 20_600, liters: 30, totalCost: 180 })

    const results = calculateConsumption([full, partial, first])

    expect(results.get(partial.id)?.consumptionKmPerLiter).toBeNull()
    expect(results.get(full.id)).toEqual({
      distanceDrivenKm: 600,
      consumptionKmPerLiter: 15,
      costPerKm: 0.4,
      periodLiters: 40,
      periodCost: 240
    })
  })

  it('should ignore partial fills before the first full tank', () => {
    const partial = makeInput({ odometerKm: 9_000, isFullTank: false })
    const first = makeInput({ odometerKm: 10_000 })
    const second = makeInput({ odometerKm: 10_400, liters: 40, totalCost: 200 })

    const results = calculateConsumption([partial, first, second])

    expect(results.get(partial.id)?.distanceDrivenKm).toBeNull()
    expect(results.get(first.id)?.distanceDrivenKm).toBeNull()
    expect(results.get(second.id)?.consumptionKmPerLiter).toBe(10)
  })

  it('should not divide by zero when the odometer did not move', () => {
    const first = makeInput({ odometerKm: 10_000 })
    const second = makeInput({ odometerKm: 10_000 })
    const third = makeInput({ odometerKm: 10_300, liters: 20, totalCost: 100 })

    const results = calculateConsumption([first, second, third])

    expect(results.get(second.id)?.consumptionKmPerLiter).toBeNull()
    expect(results.get(third.id)?.consumptionKmPerLiter).toBe(15)
  })

  it('should round the derived values', () => {
    const first = makeInput({ odometerKm: 0 })
    const second = makeInput({
      odometerKm: 527,
      liters: 42.35,
      totalCost: 249.82
    })

    const result = calculateConsumption([first, second]).get(second.id)

    expect(result?.consumptionKmPerLiter).toBe(12.44)
    expect(result?.costPerKm).toBe(0.474)
  })
})

describe('compareByOdometer', () => {
  it('should order by odometer and then by date', () => {
    const early = makeInput({ odometerKm: 100, date: new Date('2026-01-01') })
    const late = makeInput({ odometerKm: 100, date: new Date('2026-01-02') })
    const higher = makeInput({ odometerKm: 50, date: new Date('2026-03-01') })

    expect([late, higher, early].sort(compareByOdometer)).toEqual([
      higher,
      early,
      late
    ])
  })
})
