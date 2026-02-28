/*
  Enemy entity: simple seeker with health and speed.
*/
import Phaser from 'phaser'

export default class Enemy {
  scene: Phaser.Scene
  sprite: Phaser.Physics.Arcade.Sprite
  speed = 80
  health = 50
  isDead = false
  aggroRadius = 300
  idleTimer = 0
  idleDir = 0

  constructor(scene: Phaser.Scene, x: number, y: number) {
    this.scene = scene
    this.sprite = scene.physics.add.sprite(x, y, 'enemy') as Phaser.Physics.Arcade.Sprite
    this.sprite.setOrigin(0.5)
    this.sprite.setCircle(12)
    this.sprite.setData('ref', this)
    this.sprite.setCollideWorldBounds(true)
  }

  get x() {
    return this.sprite.x
  }
  get y() {
    return this.sprite.y
  }

  update(dt: number) {
    if (this.isDead) return
    const player = (this.scene as any).player
    if (!player) return
    const dist = Phaser.Math.Distance.Between(this.x, this.y, player.x, player.y)
    if (dist > this.aggroRadius) {
      // idle: small occasional drift
      this.idleTimer -= dt
      if (this.idleTimer <= 0) {
        this.idleTimer = Phaser.Math.FloatBetween(0.8, 2.2)
        this.idleDir = Phaser.Math.FloatBetween(0, Math.PI * 2)
      }
      const idleSpeed = 12
      const vx = Math.cos(this.idleDir) * idleSpeed
      const vy = Math.sin(this.idleDir) * idleSpeed
      this.sprite.body.setVelocity(vx, vy)
      this.sprite.rotation += 0.2 * dt
    } else {
      const angle = Phaser.Math.Angle.Between(this.x, this.y, player.x, player.y)
      const vx = Math.cos(angle) * this.speed
      const vy = Math.sin(angle) * this.speed
      this.sprite.body.setVelocity(vx, vy)
      this.sprite.setRotation(angle)
    }

    if (this.health <= 0) this.isDead = true
    if (this.isDead) this.destroy()
  }

  takeDamage(amount: number) {
    this.health -= amount
    this.sprite.setTint(0xffaaaa)
    this.scene.time.addEvent({ delay: 80, callback: () => this.sprite.clearTint() })
    if (this.health <= 0) this.isDead = true
  }

  destroy() {
    if (this.sprite && !this.sprite.destroyed) this.sprite.destroy()
  }
}

// heavy enemy variant with more HP and slower speed
export class HeavyEnemy extends Enemy {
  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y)
    // increase health and reduce speed
    this.health = 120
    this.speed = 60
    // resize collision circle
    this.sprite.setCircle(14)
    // use special texture if available
    if (this.sprite.setTexture) this.sprite.setTexture('heavy-enemy')
    // tint red in case texture is missing
    this.sprite.setTint(0xee4444)
  }
}
