/*
  InputSystem: handles WASD movement, mouse aim and shooting (auto-fire).
*/
import Phaser from 'phaser'
import Player from '../entities/Player'
import { clamp } from '../utils/math'

export default class InputSystem {
  scene: Phaser.Scene
  player: Player
  keys: any
  fireRate = 6 // shots per second
  fireTimer = 0
  bulletSpeed = 900

  constructor(scene: Phaser.Scene, player: Player) {
    this.scene = scene
    this.player = player
    this.keys = scene.input.keyboard.addKeys('W,A,S,D')
  }

  update(dt: number) {
    // movement
    let mx = 0
    let my = 0
    if (this.keys.W.isDown) my -= 1
    if (this.keys.S.isDown) my += 1
    if (this.keys.A.isDown) mx -= 1
    if (this.keys.D.isDown) mx += 1
    const len = Math.hypot(mx, my)
    if (len > 0) {
      mx /= len
      my /= len
    }
    this.player.setVelocity(mx * this.player.speed, my * this.player.speed)

    // aim
    const pointer = this.scene.input.activePointer
    const world = this.scene.cameras.main.getWorldPoint(pointer.x, pointer.y)
    this.player.aimAt(world.x, world.y)

    // shooting
    if (pointer.isDown) {
      this.fireTimer -= dt
      const interval = 1 / this.fireRate
      if (this.fireTimer <= 0) {
        this.fireTimer = interval
        // require a weapon with ammo to fire
        if (!this.player.hasAmmo()) return
        const angle = Phaser.Math.Angle.Between(this.player.x, this.player.y, world.x, world.y)
        const vx = Math.cos(angle) * this.bulletSpeed
        const vy = Math.sin(angle) * this.bulletSpeed
        ;(this.scene as any).spawnBullet(this.player.x + Math.cos(angle) * 20, this.player.y + Math.sin(angle) * 20, vx, vy)
        this.player.consumeAmmo(1)
      }
    } else {
      this.fireTimer = 0
    }

    // update player
    this.player.update(dt)
  }
}
