/*
  Bullet entity: simple projectile with lifetime and velocity.
*/
import Phaser from 'phaser'

export default class Bullet {
  scene: Phaser.Scene
  sprite: Phaser.Physics.Arcade.Image
  lifetime = 1.5
  isDead = false
  damage = 25
  owner: 'player' | 'enemy' = 'player'

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    vx: number,
    vy: number,
    texture: string = 'bullet',
    owner: 'player' | 'enemy' = 'player'
  ) {
    this.scene = scene
    this.owner = owner
    this.sprite = scene.physics.add.image(x, y, texture) as Phaser.Physics.Arcade.Image
    this.sprite.setVelocity(vx, vy)
    // collision radius half of texture size (4)
    this.sprite.setCircle(4)
    this.sprite.setData('ref', this)
    this.sprite.setData('owner', owner)
  }

  update(dt: number) {
    if (this.isDead) return
    this.lifetime -= dt
    if (this.lifetime <= 0) this.isDead = true
    if (this.sprite.x < -200 || this.sprite.x > 2600 || this.sprite.y < -200 || this.sprite.y > 2600) this.isDead = true
    if (this.isDead) this.destroy()
  }

  destroy() {
    if (this.sprite && !this.sprite.destroyed) this.sprite.destroy()
  }
}
