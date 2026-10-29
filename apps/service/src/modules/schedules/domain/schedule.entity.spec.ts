import { faker } from '@faker-js/faker'
import {
  makeSchedule,
  makeSchedulePayload
} from '@test/factories/make-schedule'
import { describe, expect, it } from 'vitest'

import { PayloadError } from '@/core/domain/errors/payload-error'

import { MaintenanceSchedule } from './schedule.entity'

describe('MaintenanceSchedule entity', () => {
  const userId = faker.string.alphanumeric(32)
  const start = {
    today: new Date('2026-06-01T00:00:00Z'),
    currentOdometerKm: 42_000
  }

  describe('create()', () => {
    it('should start the cycle today at the current km by default', () => {
      const schedule = MaintenanceSchedule.create(
        userId,
        makeSchedulePayload({ intervalMonths: 6, intervalKm: 10_000 }),
        start
      )

      expect(schedule.lastExecutedAt).toEqual(start.today)
      expect(schedule.lastExecutedOdometerKm).toBe(42_000)
      expect(schedule.nextDueDate).toEqual(new Date('2026-12-01T00:00:00Z'))
      expect(schedule.nextDueOdometerKm).toBe(52_000)
      expect(schedule.alertDaysBefore).toBe(30)
      expect(schedule.alertKmBefore).toBe(500)
    })

    it('should use the informed last execution', () => {
      const schedule = MaintenanceSchedule.create(
        userId,
        makeSchedulePayload({
          intervalMonths: 12,
          intervalKm: 10_000,
          lastExecutedAt: new Date('2026-01-20T15:00:00Z'),
          lastExecutedOdometerKm: 35_000
        }),
        start
      )

      expect(schedule.nextDueDate).toEqual(new Date('2027-01-20T00:00:00Z'))
      expect(schedule.nextDueOdometerKm).toBe(45_000)
    })

    it('should drop the interval the rule does not use', () => {
      const schedule = MaintenanceSchedule.create(
        userId,
        makeSchedulePayload({
          triggerRule: 'TIME_ONLY',
          intervalMonths: 24,
          intervalKm: 10_000
        }),
        start
      )

      expect(schedule.intervalKm).toBeNull()
      expect(schedule.nextDueOdometerKm).toBeNull()
    })

    it.each([
      ['an empty title', { title: '  ' }],
      [
        'a missing interval for the rule',
        { triggerRule: 'ODOMETER_ONLY' as const, intervalKm: null }
      ],
      ['a zero interval', { intervalMonths: 0 }],
      ['a negative alert window', { alertDaysBefore: -1 }],
      ['a future last execution', { lastExecutedAt: new Date('2099-01-01') }]
    ])('should reject %s', (_, override) => {
      expect(() =>
        MaintenanceSchedule.create(userId, makeSchedulePayload(override), start)
      ).toThrow(PayloadError)
    })
  })

  describe('update()', () => {
    it('should ignore undefined, keep the identity and recalculate the due', () => {
      const schedule = makeSchedule({
        lastExecutedAt: new Date('2026-01-10T00:00:00Z'),
        lastExecutedOdometerKm: 30_000
      })
      const { id, vehicleId, userId: owner, title } = schedule

      schedule.update({
        title: undefined,
        intervalKm: 5_000,
        description: null
      })

      expect(schedule.id).toBe(id)
      expect(schedule.vehicleId).toBe(vehicleId)
      expect(schedule.userId).toBe(owner)
      expect(schedule.title).toBe(title)
      expect(schedule.description).toBeNull()
      expect(schedule.nextDueOdometerKm).toBe(35_000)
    })

    it('should throw PayloadError and keep the previous state', () => {
      const schedule = makeSchedule()
      const title = schedule.title

      expect(() => schedule.update({ title: '' })).toThrow(PayloadError)
      expect(schedule.title).toBe(title)
    })
  })

  describe('registerExecution()', () => {
    it('should restart the cycle from a newer execution', () => {
      const schedule = makeSchedule({
        lastExecutedAt: new Date('2026-01-10T00:00:00Z'),
        lastExecutedOdometerKm: 30_000
      })

      expect(
        schedule.registerExecution(new Date('2026-06-15T10:00:00Z'), 39_800)
      ).toBe(true)
      expect(schedule.lastExecutedAt).toEqual(new Date('2026-06-15T00:00:00Z'))
      expect(schedule.nextDueDate).toEqual(new Date('2026-12-15T00:00:00Z'))
      expect(schedule.nextDueOdometerKm).toBe(49_800)
    })

    it('should ignore an older execution unless forced', () => {
      const schedule = makeSchedule({
        lastExecutedAt: new Date('2026-06-01T00:00:00Z'),
        lastExecutedOdometerKm: 40_000
      })

      expect(schedule.registerExecution(new Date('2026-01-01'), 30_000)).toBe(
        false
      )
      expect(schedule.lastExecutedOdometerKm).toBe(40_000)

      expect(
        schedule.registerExecution(new Date('2026-01-01'), 30_000, true)
      ).toBe(true)
      expect(schedule.lastExecutedOdometerKm).toBe(30_000)
    })
  })

  describe('evaluate()', () => {
    it('should report when the status worsened', () => {
      const schedule = makeSchedule({
        lastExecutedAt: new Date('2026-01-01T00:00:00Z'),
        lastExecutedOdometerKm: 30_000
      })
      const today = new Date('2026-02-01T00:00:00Z')

      expect(schedule.evaluate(39_600, today)).toMatchObject({
        status: 'DUE_SOON',
        changed: true,
        worsened: true
      })
      expect(schedule.alertStatus).toBe('DUE_SOON')
      expect(schedule.evaluate(39_700, today)).toMatchObject({
        changed: false,
        worsened: false
      })
      expect(schedule.evaluate(30_100, today)).toMatchObject({
        status: 'ON_TRACK',
        changed: true,
        worsened: false
      })
    })
  })
})
