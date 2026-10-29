import { faker } from '@faker-js/faker'
import {
  makeMaintenance,
  makeMaintenanceItemPayload,
  makeMaintenancePayload
} from '@test/factories/make-maintenance'
import { describe, expect, it } from 'vitest'

import { PayloadError } from '@/core/domain/errors/payload-error'

import { Maintenance } from './maintenance.entity'

describe('Maintenance entity', () => {
  const userId = faker.string.alphanumeric(32)

  describe('create()', () => {
    it('should calculate item totals, parts, total and warranties', () => {
      const scheduleId = faker.string.uuid()
      const maintenance = Maintenance.create(
        userId,
        makeMaintenancePayload({
          date: new Date('2026-03-10T14:00:00Z'),
          laborCost: 150,
          items: [
            makeMaintenanceItemPayload({
              name: '  Óleo 5W30 (4L)  ',
              quantity: 4,
              unitPrice: 45.5,
              scheduleId
            }),
            makeMaintenanceItemPayload({
              name: 'Bateria 60Ah',
              unitPrice: 520,
              warrantyMonths: 24,
              brand: '  '
            })
          ]
        })
      )

      expect(maintenance.date).toEqual(new Date('2026-03-10T00:00:00Z'))
      expect(maintenance.items[0]).toMatchObject({
        name: 'Óleo 5W30 (4L)',
        totalPrice: 182
      })
      expect(maintenance.items[1]).toMatchObject({
        brand: null,
        warrantyUntil: new Date('2028-03-10T00:00:00Z')
      })
      expect(maintenance.partsCost).toBe(702)
      expect(maintenance.totalAmount).toBe(852)
      expect(maintenance.scheduleIds).toEqual([scheduleId])
    })

    it('should accept a fixed total and a parts cost without items', () => {
      const maintenance = Maintenance.create(
        userId,
        makeMaintenancePayload({
          items: [],
          laborCost: 100,
          partsCost: 250,
          totalAmount: 320
        })
      )

      expect(maintenance.partsCost).toBe(250)
      expect(maintenance.totalAmount).toBe(320)
    })

    it.each([
      ['an empty title', { title: ' ' }],
      ['a negative labor cost', { laborCost: -1 }],
      [
        'an item without name',
        { items: [makeMaintenanceItemPayload({ name: '' })] }
      ],
      [
        'an item with zero quantity',
        { items: [makeMaintenanceItemPayload({ quantity: 0 })] }
      ],
      ['a fractional odometer', { odometerKm: 10.5 }],
      ['a future date', { date: new Date('2099-01-01') }]
    ])('should reject %s', (_, override) => {
      expect(() =>
        Maintenance.create(userId, makeMaintenancePayload(override))
      ).toThrow(PayloadError)
    })
  })

  describe('update()', () => {
    it('should keep a calculated total calculated and replace the items', () => {
      const maintenance = makeMaintenance(userId, {
        laborCost: 100,
        items: [makeMaintenanceItemPayload({ unitPrice: 50 })]
      })
      const { id, vehicleId } = maintenance

      maintenance.update({
        items: [
          makeMaintenanceItemPayload({ unitPrice: 30 }),
          makeMaintenanceItemPayload({ unitPrice: 20 })
        ],
        workshopName: null
      })

      expect(maintenance.id).toBe(id)
      expect(maintenance.vehicleId).toBe(vehicleId)
      expect(maintenance.items).toHaveLength(2)
      expect(maintenance.totalAmount).toBe(150)
      expect(maintenance.workshopName).toBeNull()
    })

    it('should keep a fixed total until a new one is informed', () => {
      const maintenance = makeMaintenance(userId, {
        laborCost: 100,
        items: [],
        partsCost: 0,
        totalAmount: 80
      })

      maintenance.update({ laborCost: 200 })
      expect(maintenance.totalAmount).toBe(80)

      maintenance.update({ totalAmount: 210 })
      expect(maintenance.totalAmount).toBe(210)
    })

    it('should throw PayloadError and keep the previous state', () => {
      const maintenance = makeMaintenance(userId)
      const title = maintenance.title

      expect(() => maintenance.update({ title: '' })).toThrow(PayloadError)
      expect(maintenance.title).toBe(title)
    })
  })
})
