import { describe, expect, it } from 'vitest'

import {
  addMonthsUtc,
  differenceInCalendarDaysUtc,
  todayInTimeZone
} from './utc-date'

describe('utc-date', () => {
  it('should add months clamping to the last day of the month', () => {
    expect(addMonthsUtc(new Date('2026-01-31T00:00:00Z'), 1)).toEqual(
      new Date('2026-02-28T00:00:00Z')
    )
    expect(addMonthsUtc(new Date('2028-01-31T00:00:00Z'), 1)).toEqual(
      new Date('2028-02-29T00:00:00Z')
    )
    expect(addMonthsUtc(new Date('2026-08-15T00:00:00Z'), 6)).toEqual(
      new Date('2027-02-15T00:00:00Z')
    )
  })

  it('should count calendar days', () => {
    expect(
      differenceInCalendarDaysUtc(
        new Date('2026-03-10T00:00:00Z'),
        new Date('2026-03-01T23:00:00Z')
      )
    ).toBe(9)
    expect(
      differenceInCalendarDaysUtc(
        new Date('2026-03-01T00:00:00Z'),
        new Date('2026-03-10T00:00:00Z')
      )
    ).toBe(-9)
  })

  it('should return the calendar day in São Paulo', () => {
    // 01:30 UTC ainda é o dia anterior em São Paulo (UTC-3)
    expect(
      todayInTimeZone('America/Sao_Paulo', new Date('2026-03-11T01:30:00Z'))
    ).toEqual(new Date('2026-03-10T00:00:00Z'))
  })
})
