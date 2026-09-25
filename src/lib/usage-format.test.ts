import { describe, expect, it } from 'vitest'
import { formatUsagePair } from './usage-format'

describe('formatUsagePair', () => {
  it('shows session and weekly values', () => {
    expect(formatUsagePair(9.4, 10.6)).toBe('9|11%')
  })

  it('shows only weekly when there is no session window', () => {
    expect(formatUsagePair(null, 9)).toBe('9%')
    expect(formatUsagePair(undefined, 9)).toBe('9%')
  })

  it('shows placeholders when data is missing', () => {
    expect(formatUsagePair(null, null)).toBe('--|--%')
    expect(formatUsagePair(9, null)).toBe('9|--%')
  })
})
