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
  key1!: Phaser.Input.Keyboard.Key
  key2!: Phaser.Input.Keyboard.Key
  pistolFireRate = 6 // shots per second
  shotgunFireRate = 2.5 // shots per second (slower)
  fireTimer = 0
  bulletSpeed = 900

  constructor(scene: Phaser.Scene, player: Player) {
    this.scene = scene
    this.player = player
    this.keys = scene.input.keyboard.addKeys('W,A,S,D')
    this.key1 = scene.input.keyboard.addKey('ONE')
    this.key2 = scene.input.keyboard.addKey('TWO')
  }

  update(dt: number) {
    // convert dt from milliseconds to seconds
    dt = dt / 1000

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

    // handle weapon switching keys
    if (Phaser.Input.Keyboard.JustDown(this.key1)) {
      this.player.switchWeapon('Pistol')
    }
    if (Phaser.Input.Keyboard.JustDown(this.key2)) {
      this.player.switchWeapon('Shotgun')
    }

    // aim
    const pointer = this.scene.input.activePointer
    const world = this.scene.cameras.main.getWorldPoint(pointer.x, pointer.y)
    this.player.aimAt(world.x, world.y)

    // shooting
    if (pointer.isDown) {
      this.fireTimer -= dt
      // use appropriate fire rate based on current weapon
      const rate = this.player.currentWeapon === 'Shotgun' ? this.shotgunFireRate : this.pistolFireRate
      const interval = 1 / rate
      if (this.fireTimer <= 0) {
        this.fireTimer = interval
        // require a weapon with ammo to fire
        if (!this.player.hasAmmo()) return
        const rawAngle = Phaser.Math.Angle.Between(this.player.x, this.player.y, world.x, world.y)
        this.player.aimAt(world.x, world.y)

        const spawnDist = 12
        const spawnX = this.player.x + Math.cos(rawAngle) * spawnDist
        const spawnY = this.player.y + Math.sin(rawAngle) * spawnDist

        if (this.player.currentWeapon === 'Shotgun') {
          const pellets = Phaser.Math.Between(4, 5)
          for (let i = 0; i < pellets; i++) {
            const spread = Phaser.Math.FloatBetween(-0.25, 0.25)
            const ang = rawAngle + spread
            const vx2 = Math.cos(ang) * this.bulletSpeed
            const vy2 = Math.sin(ang) * this.bulletSpeed
            ;(this.scene as any).spawnBullet(spawnX, spawnY, vx2, vy2)
          }
        } else {
          const vx = Math.cos(rawAngle) * this.bulletSpeed
          const vy = Math.sin(rawAngle) * this.bulletSpeed
          ;(this.scene as any).spawnBullet(spawnX, spawnY, vx, vy)
        }
        this.player.consumeAmmo(1)
      }
    } else {
      this.fireTimer = 0
    }

    // update player
    this.player.update(dt)
  }
}
