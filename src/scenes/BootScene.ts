/*
  BootScene: prepares simple textures using Phaser Graphics so no external assets are required.
*/
import Phaser from 'phaser'
import { ARENA_WIDTH, ARENA_HEIGHT } from '../game/config'

export default class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' })
  }

  preload() {
    // no external assets
  }

  create() {
    // create player texture: centered triangle
    const g = this.add.graphics({ x: 0, y: 0 })
    const size = 48
    const cx = size / 2
    const cy = size / 2
    g.fillStyle(0x00ccff)
    g.beginPath()
    g.moveTo(cx + 12, cy)
    g.lineTo(cx - 12, cy - 12)
    g.lineTo(cx - 12, cy + 12)
    g.closePath()
    g.fillPath()
    g.generateTexture('player', size, size)
    g.clear()

    // bullet
    g.fillStyle(0xffff66)
    g.fillCircle(6, 6, 6)
    g.generateTexture('bullet', 12, 12)
    g.clear()

    // enemy
    g.fillStyle(0xff6666)
    g.fillCircle(16, 16, 16)
    g.generateTexture('enemy', 32, 32)
    g.clear()

    // ammo texture: small box
    const aSize = 16
    g.fillStyle(0x88ff88)
    g.fillRect(0, 0, aSize, aSize)
    g.generateTexture('ammo', aSize, aSize)
    g.clear()

    // building texture (simple block with windows)
    const bSize = 128
    const bx = bSize / 2
    const by = bSize / 2
    g.fillStyle(0x444444)
    g.fillRect(0, 0, bSize, bSize)
    g.fillStyle(0x222222)
    for (let yy = 12; yy < bSize - 12; yy += 24) {
      for (let xx = 12; xx < bSize - 12; xx += 24) {
        if (Math.random() > 0.5) g.fillRect(xx, yy, 12, 12)
      }
    }
    g.generateTexture('building', bSize, bSize)
    g.destroy()

    // proceed to start menu (textures ready)
    this.scene.start('StartScene')
  }
}
