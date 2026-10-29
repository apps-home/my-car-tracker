import { faker } from '@faker-js/faker'
import { makeVehicle, makeVehiclePayload } from '@test/factories/make-vehicle'
import { describe, expect, it } from 'vitest'

import { PayloadError } from '@/core/domain/errors/payload-error'

import { Vehicle } from './vehicle.entity'

describe('Vehicle entity', () => {
  const userId = faker.string.alphanumeric(32)

  describe('create()', () => {
    it('should apply the defaults', () => {
      const payload = makeVehiclePayload({
        licensePlate: undefined,
        defaultFuelType: undefined
      })

      const vehicle = Vehicle.create(userId, payload)

      expect(vehicle.userId).toBe(userId)
      expect(vehicle.currentOdometerKm).toBe(payload.initialOdometerKm)
      expect(vehicle.defaultFuelType).toBe('GASOLINE_COMMON')
      expect(vehicle.isActive).toBe(true)
      expect(vehicle.licensePlate).toBeNull()
      expect(vehicle.photoUrl).toBeNull()
    })

    it('should trim texts and normalize the license plate', () => {
      const vehicle = Vehicle.create(
        userId,
        makeVehiclePayload({
          name: '  Civic  ',
          color: '   ',
          licensePlate: 'abc-1d23'
        })
      )

      expect(vehicle.name).toBe('Civic')
      expect(vehicle.color).toBeNull()
      expect(vehicle.licensePlate).toBe('ABC1D23')
    })

    it('should accept the old plate format', () => {
      const vehicle = Vehicle.create(
        userId,
        makeVehiclePayload({ licensePlate: 'ABC 1234' })
      )

      expect(vehicle.licensePlate).toBe('ABC1234')
    })

    it.each([
      ['an empty name', { name: '  ' }],
      ['an invalid plate', { licensePlate: 'AB12345' }],
      ['a model year too far ahead', { modelYear: 3000 }],
      [
        'a manufacture year after the model year',
        { modelYear: 2023, manufactureYear: 2024 }
      ],
      ['a negative odometer', { initialOdometerKm: -1 }],
      [
        'a current odometer below the initial',
        { initialOdometerKm: 1000, currentOdometerKm: 10 }
      ],
      ['a zero tank capacity', { fuelTankCapacityLiters: 0 }]
    ])('should reject %s', (_, override) => {
      expect(() =>
        Vehicle.create(userId, makeVehiclePayload(override))
      ).toThrow(PayloadError)
    })
  })

  describe('update()', () => {
    it('should ignore undefined fields and keep the identity', () => {
      const vehicle = makeVehicle({ color: 'Prata' })
      const { id, userId: owner, name, createdAt } = vehicle

      vehicle.update({ color: undefined, notes: 'Pneus novos' })

      expect(vehicle.id).toBe(id)
      expect(vehicle.userId).toBe(owner)
      expect(vehicle.createdAt).toBe(createdAt)
      expect(vehicle.name).toBe(name)
      expect(vehicle.color).toBe('Prata')
      expect(vehicle.notes).toBe('Pneus novos')
    })

    it('should clear nullable fields with null', () => {
      const vehicle = makeVehicle({ licensePlate: 'ABC1D23' })

      vehicle.update({ licensePlate: null, fuelTankCapacityLiters: null })

      expect(vehicle.licensePlate).toBeNull()
      expect(vehicle.fuelTankCapacityLiters).toBeNull()
    })

    it('should normalize the updated fields', () => {
      const vehicle = makeVehicle()

      vehicle.update({ licensePlate: 'xyz-9a87', brand: ' Volkswagen ' })

      expect(vehicle.licensePlate).toBe('XYZ9A87')
      expect(vehicle.brand).toBe('Volkswagen')
    })

    it('should throw PayloadError and keep the previous state', () => {
      const vehicle = makeVehicle()
      const name = vehicle.name

      expect(() => vehicle.update({ name: null as unknown as string })).toThrow(
        PayloadError
      )
      expect(vehicle.name).toBe(name)
    })

    it('should inactivate the vehicle', () => {
      const vehicle = makeVehicle()

      vehicle.update({ isActive: false })

      expect(vehicle.isActive).toBe(false)
    })
  })

  describe('syncOdometer()', () => {
    it('should move the odometer forward', () => {
      const vehicle = makeVehicle({
        initialOdometerKm: 10_000,
        currentOdometerKm: 20_000
      })

      expect(vehicle.syncOdometer(20_500)).toBe(true)
      expect(vehicle.currentOdometerKm).toBe(20_500)
    })

    it('should ignore a lower or equal odometer', () => {
      const vehicle = makeVehicle({
        initialOdometerKm: 10_000,
        currentOdometerKm: 20_000
      })

      expect(vehicle.syncOdometer(20_000)).toBe(false)
      expect(vehicle.syncOdometer(15_000)).toBe(false)
      expect(vehicle.currentOdometerKm).toBe(20_000)
    })
  })
})
