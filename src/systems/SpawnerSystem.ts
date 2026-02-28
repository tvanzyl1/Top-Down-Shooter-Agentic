/*
  SpawnerSystem: spawns enemies outside camera view around the player, obeys arena bounds.
*/
import Phaser from 'phaser'
import GameScene from '../scenes/GameScene'
import { ARENA_WIDTH, ARENA_HEIGHT } from '../game/config'

export default class SpawnerSystem {
  scene: GameScene
  timer = 0
  interval = 2.2
  ammoTimer = 20

  constructor(scene: GameScene) {
    this.scene = scene
  }

  update(dt: number) {
    this.timer -= dt
    if (this.timer <= 0) {
      this.timer = this.interval
      this.spawnWave()
    }

    // ammo spawn timer
    this.ammoTimer -= dt
    if (this.ammoTimer <= 0) {
      this.ammoTimer = Phaser.Math.FloatBetween(15, 30)
      if (this.scene && (this.scene as any).createAmmo) (this.scene as any).createAmmo(1)
    }
  }

  spawnWave() {
    const cam = this.scene.cameras.main
    const px = this.scene.player.x
    const py = this.scene.player.y
    // spawn 1-3 enemies
    const count = Phaser.Math.Between(1, 3)
    for (let i = 0; i < count; i++) {
      const angle = Phaser.Math.FloatBetween(0, Math.PI * 2)
      const margin = Math.max(cam.width, cam.height) * 0.6
      // pick a spawn point that is not inside any building
      let sx = Phaser.Math.Clamp(px + Math.cos(angle) * margin, 0, ARENA_WIDTH)
      let sy = Phaser.Math.Clamp(py + Math.sin(angle) * margin, 0, ARENA_HEIGHT)
      const buildings = (this.scene as any)['buildings'] || []
      let tries = 0
      while (tries < 12) {
        let collide = false
        for (const b of buildings) {
          if (!b || !b.getBounds) continue
          const bb = b.getBounds()
          if (sx > bb.left - 24 && sx < bb.right + 24 && sy > bb.top - 24 && sy < bb.bottom + 24) {
            collide = true
            break
          }
        }
        if (!collide) break
        const a2 = Phaser.Math.FloatBetween(0, Math.PI * 2)
        sx = Phaser.Math.Clamp(px + Math.cos(a2) * margin, 0, ARENA_WIDTH)
        sy = Phaser.Math.Clamp(py + Math.sin(a2) * margin, 0, ARENA_HEIGHT)
        tries++
      }
      this.scene.spawnEnemy(sx, sy)
    }
  }
}
