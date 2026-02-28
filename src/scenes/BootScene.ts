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
    // create pixel‑art player textures (24x24) seen from above; one unarmed and one armed
    const g = this.add.graphics({ x: 0, y: 0 })
    const pSize = 24
    const center = pSize / 2

    // ---------------------------------------------------------
    // unarmed version
    // ---------------------------------------------------------
    g.clear()
    // jacket / torso
    g.fillStyle(0x553300)
    g.fillRect(center - 6, center - 6, 12, 12)
    // head (skin tone)
    g.fillStyle(0xffddaa)
    g.fillRect(center - 4, center - 10, 8, 8)
    // hair
    g.fillStyle(0x885522)
    g.fillRect(center - 4, center - 10, 8, 4)
    // arms (at sides)
    g.fillStyle(0x553300)
    g.fillRect(center - 10, center - 4, 4, 8)
    g.fillRect(center + 6, center - 4, 4, 8)
    g.generateTexture('player', pSize, pSize)

    // ---------------------------------------------------------
    // armed version (same base plus guns on top)
    // ---------------------------------------------------------
    g.clear()
    // reuse unarmed drawing steps
    g.fillStyle(0x553300)
    g.fillRect(center - 6, center - 6, 12, 12)
    g.fillStyle(0xffddaa)
    g.fillRect(center - 4, center - 10, 8, 8)
    g.fillStyle(0x885522)
    g.fillRect(center - 4, center - 10, 8, 4)
    g.fillStyle(0x553300)
    g.fillRect(center - 10, center - 4, 4, 8)
    g.fillRect(center + 6, center - 4, 4, 8)
    // guns (two small dark rectangles in front of the head)
    g.fillStyle(0x222222)
    g.fillRect(center - 6, center - 14, 4, 6)
    g.fillRect(center + 2, center - 14, 4, 6)
    g.generateTexture('player-armed', pSize, pSize)
    g.clear()

    // bullet (smaller circle)
    const bulletSize = 8
    g.fillStyle(0xffff66)
    // center at (4,4) radius 4
    g.fillCircle(4, 4, 4)
    g.generateTexture('bullet', bulletSize, bulletSize)
    g.clear()

    // enemy pixel-art (20x20) – similar silhouette to player but with
    // a distinct palette and slightly chunkier features.
    const eSize = 20
    const ec = eSize / 2
    g.clear()
    // torso / jacket (dark green)
    g.fillStyle(0x336633)
    g.fillRect(ec - 6, ec - 6, 12, 12)
    // head (pale gray)
    g.fillStyle(0xcccccc)
    g.fillRect(ec - 4, ec - 10, 8, 8)
    // hair/helmet (dark gray)
    g.fillStyle(0x555555)
    g.fillRect(ec - 4, ec - 10, 8, 4)
    // arms (at sides)
    g.fillStyle(0x336633)
    g.fillRect(ec - 10, ec - 4, 4, 8)
    g.fillRect(ec + 6, ec - 4, 4, 8)
    // legs - simple blocks
    g.fillStyle(0x222222)
    g.fillRect(ec - 4, ec + 4, 4, 6)
    g.fillRect(ec + 0, ec + 4, 4, 6)
    g.generateTexture('enemy', eSize, eSize)
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
