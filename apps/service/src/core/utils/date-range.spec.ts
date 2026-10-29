import { describe, expect, it } from 'vitest'

import { isInDateRange, toDateRange } from './date-range'

describe('toDateRange', () => {
  it('should return an open range without filters', () => {
    expect(toDateRange({})).toEqual({ gte: undefined, lt: undefined })
  })

  it('should cover the whole year', () => {
    expect(toDateRange({ year: 2026 })).toEqual({
      gte: new Date('2026-01-01T00:00:00Z'),
      lt: new Date('2027-01-01T00:00:00Z')
    })
  })

  it('should cover the month, crossing the year in December', () => {
    expect(toDateRange({ year: 2026, month: 12 })).toEqual({
      gte: new Date('2026-12-01T00:00:00Z'),
      lt: new Date('2027-01-01T00:00:00Z')
    })
  })

  it('should include the whole "to" day', () => {
    expect(
      toDateRange({
        from: new Date('2026-03-10T15:00:00Z'),
        to: new Date('2026-03-20T08:00:00Z')
      })
    ).toEqual({
      gte: new Date('2026-03-10T00:00:00Z'),
      lt: new Date('2026-03-21T00:00:00Z')
    })
  })

  it('should intersect year and from/to', () => {
    expect(
      toDateRange({ year: 2026, from: new Date('2026-06-01T00:00:00Z') })
    ).toEqual({
      gte: new Date('2026-06-01T00:00:00Z'),
      lt: new Date('2027-01-01T00:00:00Z')
    })
  })
})

describe('isInDateRange', () => {
  it('should treat the range as half-open', () => {
    const range = toDateRange({ year: 2026, month: 3 })

    expect(isInDateRange(new Date('2026-03-01T00:00:00Z'), range)).toBe(true)
    expect(isInDateRange(new Date('2026-03-31T23:59:59Z'), range)).toBe(true)
    expect(isInDateRange(new Date('2026-04-01T00:00:00Z'), range)).toBe(false)
  })
})
