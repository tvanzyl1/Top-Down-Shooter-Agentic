import { describe, it, expect, vi } from 'vitest'
import CollisionSystem from '../src/systems/CollisionSystem'

describe('CollisionSystem', () => {
  it('damages the player when an enemy is close', () => {
    const player = { x: 0, y: 0, receiveDamage: vi.fn() }
    const scene = {
      player,
      enemies: [{ sprite: { x: 10, y: 0 } }],
    }
    const system = new CollisionSystem(scene as any)

    system.update(0.5)
    expect(player.receiveDamage).toHaveBeenCalledTimes(1)
    expect(player.receiveDamage).toHaveBeenCalledWith(12 * 0.5, true)
  })

  it('does not damage the player when enemies are far away', () => {
    const player = { x: 0, y: 0, receiveDamage: vi.fn() }
    const scene = {
      player,
      enemies: [{ sprite: { x: 100, y: 100 } }],
    }
    const system = new CollisionSystem(scene as any)

    system.update(0.5)
    expect(player.receiveDamage).not.toHaveBeenCalled()
  })
})
