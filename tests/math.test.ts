import { describe, it, expect } from 'vitest'
import { clamp } from '../src/utils/math'

describe('clamp helper', () => {
  it('caps values above the upper bound', () => {
    expect(clamp(50, 0, 20)).toBe(20)
  })

  it('caps values below the lower bound', () => {
    expect(clamp(-5, 0, 20)).toBe(0)
  })

  it('leaves values within bounds untouched', () => {
    expect(clamp(10, 0, 20)).toBe(10)
  })
})
