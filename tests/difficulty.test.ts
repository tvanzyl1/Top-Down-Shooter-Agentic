import { describe, it, expect } from 'vitest'
import DifficultySystem from '../src/systems/DifficultySystem'

describe('DifficultySystem', () => {
  it('trends difficulty upward as time passes', () => {
    const mockScene = {
      spawner: { interval: 2.2 },
      enemies: [
        { speed: 40, health: 5 },
        { speed: 60, health: 30 },
      ],
    }
    const system = new DifficultySystem(mockScene as any)
    system.update(45)

    expect(mockScene.spawner.interval).toBeCloseTo(Math.max(0.5, 2.2 - 2 * 0.12))
    expect(mockScene.enemies[0].speed).toBe(80 + 2 * 8)
    expect(mockScene.enemies[1].speed).toBe(80 + 2 * 8)
    expect(mockScene.enemies[0].health).toBe(20)
    expect(mockScene.enemies[1].health).toBe(30)
  })
})
