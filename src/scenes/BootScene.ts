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

    // weapon pickup texture (pistol top‑down, 16x16)
    const wSize = 16
    g.fillStyle(0x888888)
    // barrel
    g.fillRect(2, 6, 10, 4)
    // grip
    g.fillRect(8, 10, 4, 4)
    g.generateTexture('weapon', wSize, wSize)
    g.clear()

    // shotgun pickup texture (shotgun top‑down, 20x20)
    const sgSize = 20
    g.fillStyle(0x555555)
    // long barrel
    g.fillRect(2, sgSize / 2 - 2, sgSize - 4, 4)
    // stock
    g.fillRect(6, sgSize / 2 + 2, 4, 6)
    g.generateTexture('shotgun', sgSize, sgSize)
    g.clear()

    // ammo pickup texture: small box with inner accent (pistol ammo)
    const aSize = 12
    g.fillStyle(0x88ff88)
    g.fillRect(0, 0, aSize, aSize)
    g.fillStyle(0xffff66)
    g.fillRect(2, 2, aSize - 4, aSize - 4)
    g.generateTexture('ammo', aSize, aSize)
    g.clear()

    // shotgun shell texture (orange square)
    const sSize = 8
    g.fillStyle(0xffaa00)
    g.fillRect(0, 0, sSize, sSize)
    g.generateTexture('shell', sSize, sSize)
    g.clear()

    // health pack pickup texture: red square with a white cross
    const hpSize = 14
    g.fillStyle(0xcc3333)
    g.fillRect(0, 0, hpSize, hpSize)
    g.fillStyle(0xffffff)
    g.fillRect(5, 2, 4, 10)
    g.fillRect(2, 5, 10, 4)
    g.generateTexture('health-pack', hpSize, hpSize)
    g.clear()

    // split tree art into a small solid trunk and a canopy that can render above actors
    const trunkWidth = 12
    const trunkHeight = 16
    g.fillStyle(0x5c3b1e)
    g.fillRect(0, 0, trunkWidth, trunkHeight)
    g.fillStyle(0x6f4826)
    g.fillRect(2, 0, 2, trunkHeight)
    g.fillRect(8, 0, 2, trunkHeight)
    g.generateTexture('tree-trunk', trunkWidth, trunkHeight)
    g.clear()

    const canopySize = 32
    const cc = canopySize / 2
    g.fillStyle(0x1f6f3a)
    g.fillCircle(cc, cc + 2, 10)
    g.fillStyle(0x2f8c4b)
    g.fillCircle(cc - 6, cc - 1, 8)
    g.fillCircle(cc + 6, cc - 1, 8)
    g.fillStyle(0x46a85f)
    g.fillCircle(cc, cc - 6, 7)
    g.generateTexture('tree-canopy', canopySize, canopySize)
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
    // heavy enemy (bigger, red) - 24x24 for extra size
    const hSize = 24
    const hc = hSize / 2
    g.clear()
    // torso (red)
    g.fillStyle(0xcc3333)
    g.fillRect(hc - 7, hc - 7, 14, 14)
    // head (darker red)
    g.fillStyle(0x993333)
    g.fillRect(hc - 5, hc - 11, 10, 10)
    // arms
    g.fillStyle(0xcc3333)
    g.fillRect(hc - 11, hc - 5, 4, 10)
    g.fillRect(hc + 7, hc - 5, 4, 10)
    // legs
    g.fillStyle(0x662222)
    g.fillRect(hc - 5, hc + 5, 5, 8)
    g.fillRect(hc + 0, hc + 5, 5, 8)
    g.generateTexture('heavy-enemy', hSize, hSize)
    g.clear()


    // building textures with varying sizes and lights in windows
    const buildingSizes = [
      { key: 'building-small', size: 48, windowOffset: 6, windowSize: 6, windowSpacing: 12 },
      { key: 'building-medium', size: 80, windowOffset: 8, windowSize: 8, windowSpacing: 16 },
      { key: 'building', size: 128, windowOffset: 12, windowSize: 12, windowSpacing: 24 },
      { key: 'building-large', size: 160, windowOffset: 14, windowSize: 14, windowSpacing: 28 }
    ]

    for (const buildingConfig of buildingSizes) {
      g.clear()
      const bSize = buildingConfig.size
      const colorVariation = Phaser.Math.Between(-20, 20)
      const baseColor = 0x444444 + (colorVariation << 16) + (colorVariation << 8) + colorVariation
      
      g.fillStyle(baseColor)
      g.fillRect(0, 0, bSize, bSize)
      
      // draw windows with some lit
      const windowOffset = buildingConfig.windowOffset
      const windowSize = buildingConfig.windowSize
      const windowSpacing = buildingConfig.windowSpacing
      
      for (let yy = windowOffset; yy < bSize - windowOffset; yy += windowSpacing) {
        for (let xx = windowOffset; xx < bSize - windowOffset; xx += windowSpacing) {
          // randomly determine if this window is lit (about 40% chance)
          const isLit = Math.random() > 0.6
          g.fillStyle(isLit ? 0xffff99 : 0x111111) // yellow light or dark window
          g.fillRect(xx, yy, windowSize, windowSize)
        }
      }
      
      g.generateTexture(buildingConfig.key, bSize, bSize)
    }
    
    g.destroy()

    // proceed to start menu (textures ready)
    this.scene.start('StartScene')
  }
}
