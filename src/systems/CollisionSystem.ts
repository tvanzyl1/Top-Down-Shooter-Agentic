/*
  CollisionSystem: simple distance-based collision detection for bullets<->enemies and enemies->player.
*/
import type GameScene from '../scenes/GameScene'

export default class CollisionSystem {
  scene: GameScene

  constructor(scene: GameScene) {
    this.scene = scene
  }

  update(dt: number) {
    // enemies vs player (damage over time). Use receiveDamage with bypass
    // so standing inside multiple enemies applies continuous DPS.
    for (const e of this.scene.enemies) {
      const p = this.scene.player
      const dx = e.sprite.x - p.x
      const dy = e.sprite.y - p.y
      const dist = Math.hypot(dx, dy)
      if (dist < 28) {
        p.receiveDamage(12 * dt, true)
      }
    }
  }
}
