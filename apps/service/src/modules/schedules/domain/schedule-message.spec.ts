import { describe, expect, it } from 'vitest'

import { describeDue } from './schedule-message'

describe('describeDue', () => {
  it('should describe the time and km remaining', () => {
    expect(
      describeDue({ status: 'DUE_SOON', daysRemaining: 18, kmRemaining: 420 })
    ).toBe('Faltam 18 dias ou 420 km')
    expect(
      describeDue({ status: 'ON_TRACK', daysRemaining: null, kmRemaining: 1 })
    ).toBe('Faltam 1 km')
    expect(
      describeDue({ status: 'DUE_SOON', daysRemaining: 0, kmRemaining: null })
    ).toBe('Vence hoje')
  })

  it('should describe what is overdue', () => {
    expect(
      describeDue({ status: 'OVERDUE', daysRemaining: -12, kmRemaining: 800 })
    ).toBe('Vencido há 12 dias')
    expect(
      describeDue({ status: 'OVERDUE', daysRemaining: 40, kmRemaining: -1300 })
    ).toBe('Vencido por km (passou 1.300 km)')
  })
})
