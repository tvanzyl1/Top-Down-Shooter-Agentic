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
  // currently equipped weapon; 'Pistol' or 'Shotgun' (null = unarmed)
  currentWeapon: string | null = null
  // ammo counts for each type
  pistolAmmo = 0
  shotgunAmmo = 0
  // once the player has ever picked up a shotgun, shells begin spawning
  hasShotgun = false
  // once the player has ever picked up a pistol, ammo begins spawning
  hasPistol = false

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
    // rotate sprite such that its **top** (negative Y local) faces the target
    // Phaser's rotation aligns the right axis, so subtract π/2
    this.sprite.setRotation(angle - Math.PI / 2)
  }

  setVelocity(vx: number, vy: number) {
    this.sprite.body.setVelocity(vx, vy)
  }

  equipWeapon(name: string, ammo: number) {
    // add ammo to the appropriate pool
    if (name === 'Pistol') {
      this.pistolAmmo += ammo
      this.hasPistol = true
    } else if (name === 'Shotgun') {
      this.shotgunAmmo += ammo
      this.hasShotgun = true
    }
    // equip the weapon immediately
    this.currentWeapon = name
    this.updateSpriteTexture()
  }

  hasAmmo() {
    return this.getAmmoCount() > 0
  }

  consumeAmmo(count = 1) {
    const w = this.currentWeapon
    if (!w) return false
    if (w === 'Pistol') {
      if (this.pistolAmmo <= 0) return false
      this.pistolAmmo = Math.max(0, this.pistolAmmo - count)
    } else if (w === 'Shotgun') {
      if (this.shotgunAmmo <= 0) return false
      this.shotgunAmmo = Math.max(0, this.shotgunAmmo - count)
    }
    if (this.getAmmoCount() === 0) {
      // no ammo left for current weapon -> revert to unarmed texture
      this.sprite.setTexture('player')
    }
    return true
  }

  // return ammo remaining for currently equipped weapon
  getAmmoCount() {
    if (this.currentWeapon === 'Shotgun') return this.shotgunAmmo
    if (this.currentWeapon === 'Pistol') return this.pistolAmmo
    return 0
  }

  // change currently equipped weapon if available
  switchWeapon(name: string) {
    if (name === 'Shotgun' && !this.hasShotgun) return
    if (name === 'Pistol' && this.pistolAmmo <= 0) {
      // if no pistol ammo, but player might still pick it up later
      this.currentWeapon = null
      this.updateSpriteTexture()
      return
    }
    this.currentWeapon = name
    this.updateSpriteTexture()
  }

  // update sprite texture to armed/unarmed state
  private updateSpriteTexture() {
    const hasAmmo = this.getAmmoCount() > 0
    if (hasAmmo && this.currentWeapon) this.sprite.setTexture('player-armed')
    else this.sprite.setTexture('player')
  }

  // compatibility getters so existing UI code works
  get weaponName() {
    return this.currentWeapon
  }

  get ammo() {
    return this.getAmmoCount()
  }

  takeDamage(amount: number) {
    this.receiveDamage(amount, false)
  }

  heal(amount: number) {
    if (this.isDead || amount <= 0) return 0
    const nextHealth = Math.min(this.maxHealth, this.health + amount)
    const healed = nextHealth - this.health
    this.health = nextHealth
    return healed
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
