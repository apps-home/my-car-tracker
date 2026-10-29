import { makeExpense } from '@test/factories/make-expense'
import { makeFuelLog } from '@test/factories/make-fuel-log'
import { makeMaintenance } from '@test/factories/make-maintenance'
import { makeVehicle } from '@test/factories/make-vehicle'
import { describe, expect, it } from 'vitest'

import { toDateRange } from '@/core/utils/date-range'

import {
  calculateAnalyticsOverview,
  calculateMonthlyCosts
} from './tco-calculator'

describe('tco-calculator', () => {
  it('calculates TCO, cost per km and breakdowns across fuel, expenses and maintenances', () => {
    const userId = 'user-1'
    const vehicle = makeVehicle({
      userId,
      initialOdometerKm: 10_000,
      currentOdometerKm: 11_000
    })

    const log1 = makeFuelLog({
      userId,
      vehicleId: vehicle.id,
      date: new Date('2026-01-10T00:00:00Z'),
      odometerKm: 10_000,
      fuelType: 'GASOLINE_COMMON',
      liters: 40,
      pricePerLiter: 5.5,
      totalCost: 220,
      isFullTank: true
    })
    const log2 = makeFuelLog({
      userId,
      vehicleId: vehicle.id,
      date: new Date('2026-02-10T00:00:00Z'),
      odometerKm: 10_500,
      fuelType: 'GASOLINE_COMMON',
      liters: 50,
      pricePerLiter: 6,
      totalCost: 300,
      isFullTank: true
    })
    const log3 = makeFuelLog({
      userId,
      vehicleId: vehicle.id,
      date: new Date('2026-03-10T00:00:00Z'),
      odometerKm: 11_000,
      fuelType: 'ETHANOL',
      liters: 62.5,
      pricePerLiter: 4,
      totalCost: 250,
      isFullTank: true
    })

    const toll = makeExpense({
      userId,
      vehicleId: vehicle.id,
      category: 'TOLL',
      date: new Date('2026-02-15T00:00:00Z'),
      amount: 30,
      description: 'Pedágio Bandeirantes'
    })
    const ipva = makeExpense({
      userId,
      vehicleId: vehicle.id,
      category: 'IPVA',
      date: new Date('2026-01-20T00:00:00Z'),
      amount: 1200,
      description: 'IPVA cota única'
    })

    const maintenance = makeMaintenance(userId, {
      vehicleId: vehicle.id,
      type: 'PREVENTIVE',
      title: 'Revisão 10k',
      date: new Date('2026-03-15T00:00:00Z'),
      odometerKm: 11_000,
      laborCost: 200,
      items: [
        {
          name: 'Óleo 5W30',
          quantity: 4,
          unitPrice: 75
        }
      ]
    })

    const overview = calculateAnalyticsOverview({
      vehicle,
      allFuelLogs: [log1, log2, log3],
      allExpenses: [toll, ipva],
      allMaintenances: [maintenance],
      range: {}
    })

    // Combustível: 220 + 300 + 250 = 770 | Despesas: 30 + 1200 = 1230 | Manutenção: 200 + 300 = 500 => Total = 2500
    expect(overview.totalCost).toBe(2500)
    expect(overview.totalEntriesCount).toBe(6)
    expect(overview.activeMonthsCount).toBe(3)
    expect(overview.monthlyAverageCost).toBe(833.33)
    expect(overview.distanceDrivenKm).toBe(1000)
    expect(overview.totalCostPerKm).toBe(2.5)
    // Períodos fechados: 500km (300 R$, 50L -> 10 km/L) + 500km (250 R$, 62.5L -> 8 km/L) = 1000km / 550 R$ = 0.55 R$/km
    expect(overview.fuelCostPerKm).toBe(0.55)
    expect(overview.consumptionKmPerLiter).toBe(8.89)
    expect(overview.ethanolParity).toBe(0.8)
    expect(overview.maintenanceBreakdown).toEqual({
      count: 1,
      totalAmount: 500,
      laborCost: 200,
      partsCost: 300,
      preventiveCost: 500,
      correctiveCost: 0,
      inspectionCost: 0
    })

    const taxesSeries = overview.bySeries.find((s) => s.series === 'taxes')
    expect(taxesSeries).toEqual({
      series: 'taxes',
      totalAmount: 1200,
      count: 1,
      sharePercent: 48
    })
  })

  it('calculates period distance using prior odometer baseline when filtered by year', () => {
    const userId = 'user-1'
    const vehicle = makeVehicle({
      userId,
      initialOdometerKm: 10_000,
      currentOdometerKm: 18_000
    })

    const priorLog = makeFuelLog({
      userId,
      vehicleId: vehicle.id,
      date: new Date('2025-12-20T00:00:00Z'),
      odometerKm: 15_000,
      liters: 40,
      pricePerLiter: 5,
      totalCost: 200
    })
    const currentYearLog = makeFuelLog({
      userId,
      vehicleId: vehicle.id,
      date: new Date('2026-01-15T00:00:00Z'),
      odometerKm: 15_600,
      liters: 50,
      pricePerLiter: 6,
      totalCost: 300
    })

    const overview = calculateAnalyticsOverview({
      vehicle,
      allFuelLogs: [priorLog, currentYearLog],
      allExpenses: [],
      allMaintenances: [],
      range: toDateRange({ year: 2026 })
    })

    expect(overview.totalCost).toBe(300)
    expect(overview.distanceDrivenKm).toBe(600)
    expect(overview.totalCostPerKm).toBe(0.5)
  })

  it('aggregates 12 months for a specific year in calculateMonthlyCosts', () => {
    const userId = 'user-1'
    const vehicleId = 'veh-1'

    const janFuel = makeFuelLog({
      userId,
      vehicleId,
      date: new Date('2026-01-05T00:00:00Z'),
      odometerKm: 10_200,
      liters: 40,
      pricePerLiter: 5,
      totalCost: 200
    })
    const marMaintenance = makeMaintenance(userId, {
      vehicleId,
      date: new Date('2026-03-10T00:00:00Z'),
      odometerKm: 11_000,
      laborCost: 150,
      totalAmount: 450
    })

    const result = calculateMonthlyCosts({
      vehicleId,
      year: 2026,
      fuelLogs: [janFuel],
      expenses: [],
      maintenances: [marMaintenance]
    })

    expect(result.months).toHaveLength(12)
    expect(result.yearTotal).toBe(650)
    expect(result.monthlyAverage).toBe(325)
    expect(result.months[0]).toMatchObject({
      month: 1,
      fuel: 200,
      total: 200,
      count: 1
    })
    expect(result.months[2]).toMatchObject({
      month: 3,
      maintenance: 450,
      total: 450,
      count: 1
    })
  })
})
