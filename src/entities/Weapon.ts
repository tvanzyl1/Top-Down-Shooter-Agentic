/*
  Weapon entity: placed in the world; player can pick up to receive ammo.
*/
import Phaser from 'phaser'

export default class Weapon {
  scene: Phaser.Scene
  sprite: Phaser.Physics.Arcade.Sprite
  name: string
  ammo: number

  constructor(scene: Phaser.Scene, x: number, y: number, name = 'Pistol', ammo = 30) {
    this.scene = scene
    this.name = name
    this.ammo = ammo
    this.sprite = scene.physics.add.sprite(x, y, 'bullet') as Phaser.Physics.Arcade.Sprite
    // use bullet texture as temporary icon; tint to distinguish
    this.sprite.setTint(0x88ff88)
    this.sprite.setImmovable(true)
    this.sprite.setData('ref', this)
  }

  destroy() {
    if (this.sprite && !this.sprite.destroyed) this.sprite.destroy()
  }
}
