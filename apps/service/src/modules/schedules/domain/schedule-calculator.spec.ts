import { describe, expect, it } from 'vitest'

import {
  calculateNextDue,
  evaluateSchedule,
  type ScheduleState
} from './schedule-calculator'

const today = new Date('2026-06-01T00:00:00Z')

function state(override: Partial<ScheduleState>): ScheduleState {
  return {
    triggerRule: 'WHICHEVER_COMES_FIRST',
    intervalMonths: 6,
    intervalKm: 10_000,
    nextDueDate: new Date('2026-12-01T00:00:00Z'),
    nextDueOdometerKm: 60_000,
    alertDaysBefore: 30,
    alertKmBefore: 500,
    ...override
  }
}

describe('calculateNextDue', () => {
  it('should add the intervals to the last execution', () => {
    expect(
      calculateNextDue(
        {
          triggerRule: 'WHICHEVER_COMES_FIRST',
          intervalMonths: 6,
          intervalKm: 10_000
        },
        new Date('2026-06-15T00:00:00Z'),
        42_200
      )
    ).toEqual({
      nextDueDate: new Date('2026-12-15T00:00:00Z'),
      nextDueOdometerKm: 52_200
    })
  })

  it('should ignore the criteria the rule does not use', () => {
    expect(
      calculateNextDue(
        { triggerRule: 'TIME_ONLY', intervalMonths: 24, intervalKm: 10_000 },
        new Date('2026-01-10T00:00:00Z'),
        30_000
      )
    ).toEqual({
      nextDueDate: new Date('2028-01-10T00:00:00Z'),
      nextDueOdometerKm: null
    })
    expect(
      calculateNextDue(
        { triggerRule: 'ODOMETER_ONLY', intervalMonths: 6, intervalKm: 10_000 },
        new Date('2026-01-10T00:00:00Z'),
        30_000
      )
    ).toEqual({ nextDueDate: null, nextDueOdometerKm: 40_000 })
  })
})

describe('evaluateSchedule', () => {
  it('should be on track far from both limits', () => {
    expect(evaluateSchedule(state({}), 50_000, today)).toEqual({
      status: 'ON_TRACK',
      daysRemaining: 183,
      kmRemaining: 10_000
    })
  })

  it('should be due soon inside the time window, including the due day', () => {
    expect(
      evaluateSchedule(
        state({ nextDueDate: new Date('2026-06-30T00:00:00Z') }),
        50_000,
        today
      ).status
    ).toBe('DUE_SOON')
    expect(
      evaluateSchedule(state({ nextDueDate: today }), 50_000, today)
    ).toMatchObject({ status: 'DUE_SOON', daysRemaining: 0 })
  })

  it('should be overdue the day after the due date', () => {
    expect(
      evaluateSchedule(
        state({ nextDueDate: new Date('2026-05-31T00:00:00Z') }),
        50_000,
        today
      )
    ).toMatchObject({ status: 'OVERDUE', daysRemaining: -1 })
  })

  it('should follow the km limits (overdue at zero km remaining)', () => {
    expect(evaluateSchedule(state({}), 59_600, today).status).toBe('DUE_SOON')
    expect(evaluateSchedule(state({}), 60_000, today)).toMatchObject({
      status: 'OVERDUE',
      kmRemaining: 0
    })
  })

  it('should take the most critical status between time and km', () => {
    expect(
      evaluateSchedule(
        state({ nextDueDate: new Date('2026-06-20T00:00:00Z') }),
        60_100,
        today
      ).status
    ).toBe('OVERDUE')
  })

  it('should only look at the criterion of the rule', () => {
    expect(
      evaluateSchedule(
        state({ triggerRule: 'TIME_ONLY', nextDueOdometerKm: null }),
        999_999,
        today
      )
    ).toEqual({ status: 'ON_TRACK', daysRemaining: 183, kmRemaining: null })
    expect(
      evaluateSchedule(
        state({ triggerRule: 'ODOMETER_ONLY', nextDueDate: null }),
        61_000,
        today
      )
    ).toEqual({ status: 'OVERDUE', daysRemaining: null, kmRemaining: -1000 })
  })
})
