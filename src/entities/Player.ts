/*
  Player entity: handles movement, aiming proxy and health. Exposes a small `proxy` GameObject for camera follow.
*/
import Phaser from 'phaser'
import { clamp } from '../utils/math'
import { ARENA_WIDTH, ARENA_HEIGHT } from '../game/config'

export default class Player {
  scene: Phaser.Scene
  sprite: Phaser.Physics.Arcade.Sprite
  speed = 300
  health = 100
  maxHealth = 100
  isDead = false
  invuln = 0
  weaponName: string | null = null
  ammo = 0

  constructor(scene: Phaser.Scene, x: number, y: number) {
    this.scene = scene
    // create a physics sprite so collisions/blocking work
    this.sprite = scene.physics.add.sprite(x, y, 'player') as Phaser.Physics.Arcade.Sprite
    this.sprite.setOrigin(0.5)
    this.sprite.setCollideWorldBounds(true)
    this.sprite.setCircle(12)
  }

  get x() {
    return this.sprite.x
  }
  get y() {
    return this.sprite.y
  }

  update(dt: number) {
    if (this.isDead) return
    // clamp inside arena
    const cx = clamp(this.sprite.x, 0, ARENA_WIDTH)
    const cy = clamp(this.sprite.y, 0, ARENA_HEIGHT)
    this.sprite.setPosition(cx, cy)

    if (this.invuln > 0) {
      this.invuln -= dt
      this.sprite.setAlpha(this.invuln % 0.2 > 0.1 ? 0.4 : 1)
    } else {
      this.sprite.setAlpha(1)
    }
  }

  aimAt(worldX: number, worldY: number) {
    const angle = Phaser.Math.Angle.Between(this.x, this.y, worldX, worldY)
    this.sprite.setRotation(angle)
  }

  setVelocity(vx: number, vy: number) {
    this.sprite.body.setVelocity(vx, vy)
  }

  equipWeapon(name: string, ammo: number) {
    this.weaponName = name
    this.ammo = ammo
  }

  hasAmmo() {
    return this.weaponName !== null && this.ammo > 0
  }

  consumeAmmo(count = 1) {
    if (this.ammo <= 0) return false
    this.ammo = Math.max(0, this.ammo - count)
    if (this.ammo === 0) {
      // weapon empty but remains equipped (could set to null if desired)
    }
    return true
  }

  takeDamage(amount: number) {
    this.receiveDamage(amount, false)
  }

  // apply damage; when bypassInvuln is true, damage will be applied even
  // if the player is in the brief invulnerability window. This supports
  // continuous DPS from standing in enemy contact while still showing
  // a short invulnerability flash.
  receiveDamage(amount: number, bypassInvuln = false) {
    if (!bypassInvuln && this.invuln > 0) return
    if (this.isDead) return
    this.health -= amount
    this.invuln = 0.15
    if (this.health <= 0) {
      this.health = 0
      this.die()
    }
  }

  die() {
    this.isDead = true
    this.sprite.setTint(0x222222)
    this.sprite.body.enable = false
  }

  destroy() {
    this.sprite.destroy()
  }
}
