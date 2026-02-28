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
        // compute the raw angle toward the cursor; this is the direction the
        // bullet should travel. we also feed the same angle to `aimAt` so the
        // sprite rotation can be offset separately (see Player.aimAt).
        const rawAngle = Phaser.Math.Angle.Between(this.player.x, this.player.y, world.x, world.y)
        this.player.aimAt(world.x, world.y)

        // velocity along the raw angle
        const vx = Math.cos(rawAngle) * this.bulletSpeed
        const vy = Math.sin(rawAngle) * this.bulletSpeed

        // offset spawn position a bit in front of the player so bullets appear
        // to come from the gun. tweak 12px to match the drawn graphic.
        const spawnDist = 12
        const spawnX = this.player.x + Math.cos(rawAngle) * spawnDist
        const spawnY = this.player.y + Math.sin(rawAngle) * spawnDist

        ;(this.scene as any).spawnBullet(spawnX, spawnY, vx, vy)
        this.player.consumeAmmo(1)
      }
    } else {
      this.fireTimer = 0
    }

    // update player
    this.player.update(dt)
  }
}
