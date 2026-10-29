import { faker } from '@faker-js/faker'
import { makeFuelLog, makeFuelLogPayload } from '@test/factories/make-fuel-log'
import { describe, expect, it } from 'vitest'

import { PayloadError } from '@/core/domain/errors/payload-error'
import { addDaysUtc, startOfDayUtc } from '@/core/utils/utc-date'

import { FuelLog } from './fuel-log.entity'

describe('FuelLog entity', () => {
  const userId = faker.string.alphanumeric(32)

  describe('create()', () => {
    it('should calculate the total and apply the defaults', () => {
      const fuelLog = FuelLog.create(
        userId,
        makeFuelLogPayload({
          liters: 42.35,
          pricePerLiter: 5.899,
          isFullTank: undefined,
          paymentMethod: undefined
        })
      )

      expect(fuelLog.userId).toBe(userId)
      expect(fuelLog.totalCost).toBe(249.82)
      expect(fuelLog.isFullTank).toBe(true)
      expect(fuelLog.paymentMethod).toBeNull()
      expect(fuelLog.consumptionKmPerLiter).toBeNull()
    })

    it('should keep the total paid at the pump', () => {
      const fuelLog = FuelLog.create(
        userId,
        makeFuelLogPayload({ liters: 10, pricePerLiter: 5, totalCost: 50.01 })
      )

      expect(fuelLog.totalCost).toBe(50.01)
    })

    it('should store the date as the calendar day and trim texts', () => {
      const fuelLog = FuelLog.create(
        userId,
        makeFuelLogPayload({
          date: new Date('2026-03-10T18:45:00Z'),
          gasStationName: '  Shell  ',
          notes: '  '
        })
      )

      expect(fuelLog.date).toEqual(new Date('2026-03-10T00:00:00Z'))
      expect(fuelLog.gasStationName).toBe('Shell')
      expect(fuelLog.notes).toBeNull()
    })

    it.each([
      ['zero liters', { liters: 0 }],
      ['a negative price', { pricePerLiter: -1 }],
      ['a negative odometer', { odometerKm: -10 }],
      ['a fractional odometer', { odometerKm: 10.5 }],
      ['an invalid date', { date: new Date('invalid') }],
      ['a future date', { date: addDaysUtc(startOfDayUtc(new Date()), 3) }]
    ])('should reject %s', (_, override) => {
      expect(() =>
        FuelLog.create(userId, makeFuelLogPayload(override))
      ).toThrow(PayloadError)
    })
  })

  describe('update()', () => {
    it('should ignore undefined fields and keep the identity', () => {
      const fuelLog = makeFuelLog()
      const { id, vehicleId, userId: owner, createdAt, totalCost } = fuelLog

      fuelLog.update({ liters: undefined, notes: 'Posto da estrada' })

      expect(fuelLog.id).toBe(id)
      expect(fuelLog.vehicleId).toBe(vehicleId)
      expect(fuelLog.userId).toBe(owner)
      expect(fuelLog.createdAt).toBe(createdAt)
      expect(fuelLog.totalCost).toBe(totalCost)
      expect(fuelLog.notes).toBe('Posto da estrada')
    })

    it('should recalculate the total when liters change without a total', () => {
      const fuelLog = makeFuelLog({
        liters: 10,
        pricePerLiter: 5,
        totalCost: 50
      })

      fuelLog.update({ liters: 20 })

      expect(fuelLog.totalCost).toBe(100)
    })

    it('should keep the informed total', () => {
      const fuelLog = makeFuelLog({
        liters: 10,
        pricePerLiter: 5,
        totalCost: 50
      })

      fuelLog.update({ liters: 20, totalCost: 99.5 })

      expect(fuelLog.totalCost).toBe(99.5)
    })

    it('should clear nullable fields with null', () => {
      const fuelLog = makeFuelLog({
        gasStationName: faker.company.name(),
        paymentMethod: 'PIX'
      })

      fuelLog.update({ gasStationName: null, paymentMethod: null })

      expect(fuelLog.gasStationName).toBeNull()
      expect(fuelLog.paymentMethod).toBeNull()
    })

    it('should throw PayloadError and keep the previous state', () => {
      const fuelLog = makeFuelLog()
      const liters = fuelLog.liters

      expect(() => fuelLog.update({ liters: -5 })).toThrow(PayloadError)
      expect(fuelLog.liters).toBe(liters)
    })
  })

  describe('applyConsumption()', () => {
    it('should report whether the derived values changed', () => {
      const fuelLog = makeFuelLog()
      const result = {
        distanceDrivenKm: 500,
        consumptionKmPerLiter: 12.5,
        costPerKm: 0.47,
        periodLiters: 40,
        periodCost: 235
      }

      expect(fuelLog.applyConsumption(result)).toBe(true)
      expect(fuelLog.consumptionKmPerLiter).toBe(12.5)
      expect(fuelLog.applyConsumption(result)).toBe(false)
    })
  })
})
