/*
  DifficultySystem: gradually increases spawn rate and enemy speed/health over time.
*/
import GameScene from '../scenes/GameScene'

export default class DifficultySystem {
  scene: GameScene
  timeElapsed = 0

  constructor(scene: GameScene) {
    this.scene = scene
  }

  update(dt: number) {
    this.timeElapsed += dt
    // every 20s, increase difficulty slightly
    const level = Math.floor(this.timeElapsed / 20)
    ;(this.scene.spawner.interval = Math.max(0.5, 2.2 - level * 0.12))
    for (const e of this.scene.enemies) {
      e.speed = 80 + level * 8
      e.health = Math.max(20, e.health)
    }
  }
}
