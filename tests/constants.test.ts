import { describe, it, expect } from 'vitest'
import { PLAYER_MAX_HEALTH } from '../src/utils/constants'

describe('game constants', () => {
  it('defines a consistent player max health value', () => {
    expect(PLAYER_MAX_HEALTH).toBe(100)
  })
})
