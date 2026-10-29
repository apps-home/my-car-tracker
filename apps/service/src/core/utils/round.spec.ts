import { describe, expect, it } from 'vitest'

import { round } from './round'

describe('round', () => {
  it('should round half up to the given digits', () => {
    expect(round(1.005, 2)).toBe(1.01)
    expect(round(42.3456, 3)).toBe(42.346)
    expect(round(249.824, 2)).toBe(249.82)
    expect(round(10, 2)).toBe(10)
  })
})
