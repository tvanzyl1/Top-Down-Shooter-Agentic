import { beforeEach, describe, expect, it, vi } from 'vitest'
import SpawnerSystem from '../src/systems/SpawnerSystem'

const floatSequence: number[] = []
var mathMock: {
  Between: ReturnType<typeof vi.fn>
  FloatBetween: ReturnType<typeof vi.fn>
  Clamp: (value: number, min: number, max: number) => number
}

vi.mock('phaser', () => {
  const math = {
    Between: vi.fn(),
    FloatBetween: vi.fn(() => floatSequence.shift() ?? 0),
    Clamp: (value: number, min: number, max: number) => Math.min(Math.max(value, min), max),
  }
  class Scene {
    constructor(config?: any) {}
  }
  mathMock = math
  return {
    default: {
      AUTO: 'AUTO',
      Scale: { FIT: 'FIT', CENTER_BOTH: 'CENTER_BOTH' },
      Scene,
      Math: math,
    },
    Math: math,
  }
})

function createScene(score = 0) {
  return {
    cameras: { main: { width: 1000, height: 800 } },
    player: { x: 1200, y: 1200 },
    spawnEnemy: vi.fn(),
    score,
    isInsideObstacle: () => false,
  }
}

describe('SpawnerSystem', () => {
  beforeEach(() => {
    mathMock.Between.mockReset()
    mathMock.Between.mockReturnValue(2)
    floatSequence.length = 0
  })

  it('spawns a normal wave when score is low', () => {
    floatSequence.push(0, Math.PI / 2)
    const scene = createScene()
    const system = new SpawnerSystem(scene as any)

    system.spawnWave()

    expect(scene.spawnEnemy).toHaveBeenCalledTimes(2)
    expect(scene.spawnEnemy).toHaveBeenNthCalledWith(1, 1800, 1200, 'normal')
    expect(scene.spawnEnemy).toHaveBeenNthCalledWith(2, 1200, 1800, 'normal')
  })

  it('can produce heavy enemies once score passes 100', () => {
    floatSequence.push(0, Math.PI / 2)
    const scene = createScene(150)
    const randomSpy = vi.spyOn(Math, 'random')
    randomSpy.mockReturnValueOnce(0.1).mockReturnValueOnce(0.8)
    const system = new SpawnerSystem(scene as any)

    system.spawnWave()

    expect(scene.spawnEnemy).toHaveBeenNthCalledWith(1, expect.any(Number), expect.any(Number), 'heavy')
    expect(scene.spawnEnemy).toHaveBeenNthCalledWith(2, expect.any(Number), expect.any(Number), 'normal')

    randomSpy.mockRestore()
  })

  it('favors shooter enemies when the later threshold is reached', () => {
    floatSequence.push(0, Math.PI / 2)
    const scene = createScene(250)
    const randomSpy = vi.spyOn(Math, 'random')
    randomSpy
      .mockReturnValueOnce(0.05)
      .mockReturnValueOnce(0.5)
      .mockReturnValueOnce(0.8)
    const system = new SpawnerSystem(scene as any)

    system.spawnWave()

    expect(scene.spawnEnemy).toHaveBeenNthCalledWith(1, expect.any(Number), expect.any(Number), 'shooter')
    expect(scene.spawnEnemy).toHaveBeenNthCalledWith(2, expect.any(Number), expect.any(Number), 'normal')

    randomSpy.mockRestore()
  })
})
