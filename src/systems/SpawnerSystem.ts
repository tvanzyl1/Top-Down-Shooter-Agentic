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
  // additional timers for shotgun-related spawns
  shellTimer = 0
  weaponTimer = 0
  healthPackTimer = 12

  constructor(scene: GameScene) {
    this.scene = scene
  }

  update(dt: number) {
    this.timer -= dt
    if (this.timer <= 0) {
      this.timer = this.interval
      this.spawnWave()
    }

    // ammo spawn timer (pistol shells)
    this.ammoTimer -= dt
    if (this.ammoTimer <= 0) {
      this.ammoTimer = Phaser.Math.FloatBetween(15, 30)
      if (this.scene.player.hasPistol && (this.scene as any).createAmmo) (this.scene as any).createAmmo(1, 'Pistol')
    }

    // shotgun shell spawn (only after player has picked up a shotgun)
    if (this.scene.player && this.scene.player.hasShotgun) {
      this.shellTimer -= dt
      if (this.shellTimer <= 0) {
        this.shellTimer = Phaser.Math.FloatBetween(25, 50) // less frequent
        if (this.scene && (this.scene as any).createAmmo) (this.scene as any).createAmmo(1, 'Shotgun')
      }
    }

    // weapon pickup spawn: start once score threshold passed, but only if player hasn't acquired shotgun yet
    if (this.scene.score >= 100 && !this.scene.player.hasShotgun) {
      this.weaponTimer -= dt
      if (this.weaponTimer <= 0) {
        this.weaponTimer = Phaser.Math.FloatBetween(20, 40)
        if (this.scene && (this.scene as any).createWeapons) (this.scene as any).createWeapons(1, 'Shotgun')
      }
    }

    if (this.scene.healthPackGroup && this.scene.healthPackGroup.countActive(true) === 0) {
      this.healthPackTimer -= dt
      if (this.healthPackTimer <= 0) {
        const created = (this.scene as any).createHealthPack ? (this.scene as any).createHealthPack() : false
        if (created) this.healthPackTimer = 0
      }
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
      // pick a spawn point that is not inside any blocking obstacle
      let sx = Phaser.Math.Clamp(px + Math.cos(angle) * margin, 0, ARENA_WIDTH)
      let sy = Phaser.Math.Clamp(py + Math.sin(angle) * margin, 0, ARENA_HEIGHT)
      let tries = 0
      while (tries < 12) {
        if (!(this.scene as any).isInsideObstacle || !(this.scene as any).isInsideObstacle(sx, sy, 24)) break
        const a2 = Phaser.Math.FloatBetween(0, Math.PI * 2)
        sx = Phaser.Math.Clamp(px + Math.cos(a2) * margin, 0, ARENA_WIDTH)
        sy = Phaser.Math.Clamp(py + Math.sin(a2) * margin, 0, ARENA_HEIGHT)
        tries++
      }
      // decide on enemy type: heavy after score >=100 with low probability
      let type = 'normal'
      if (this.scene.score >= 100 && Math.random() < 0.2) {
        type = 'heavy'
      }
      this.scene.spawnEnemy(sx, sy, type)
    }
  }
}
