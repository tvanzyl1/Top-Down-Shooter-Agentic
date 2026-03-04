/*
  StartScene: main menu with a city-like background using generated building textures.
*/
import Phaser from 'phaser'

export default class StartScene extends Phaser.Scene {
  restartBtnBg!: Phaser.GameObjects.Rectangle
  restartBtnText!: Phaser.GameObjects.Text
  mapValueText!: Phaser.GameObjects.Text
  mapOptionContainer!: Phaser.GameObjects.Container
  selectedMap: 'City' | 'Forest' | 'Desert' = 'City'

  constructor() {
    super({ key: 'StartScene' })
  }

  create() {
    // create a simple city-like background using the existing `building` texture
    const cols = 8
    const rows = 6
    const padX = Math.max(0, this.scale.width - cols * 120) / 2
    const padY = Math.max(0, this.scale.height - rows * 120) / 2
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        const bx = padX + x * 120 + Phaser.Math.Between(-12, 12)
        const by = padY + y * 120 + Phaser.Math.Between(-12, 12)
        const s = this.add.image(bx, by, 'building')
        s.setTint(Phaser.Display.Color.GetColor(
          200 + Phaser.Math.Between(-20, 20),
          200 + Phaser.Math.Between(-20, 20),
          200 + Phaser.Math.Between(-20, 20)
        ))
        s.setScale(0.6 + Math.random() * 0.8)
        s.setRotation(Phaser.Math.FloatBetween(-0.05, 0.05))
        s.setDepth(-2)
      }
    }

    this.add.text(this.scale.width / 2, 120, 'Top-Down Survival', { font: '36px monospace', color: '#ffffff' }).setOrigin(0.5)

    const menu = this.add.container(this.scale.width / 2, this.scale.height / 2)
    const buttonWidth = 300
    const buttonHeight = 56

    const mapLabel = this.add.text(-buttonWidth / 2, -106, 'MAP', { font: 'bold 14px monospace', color: '#ffff99' }).setOrigin(0, 0.5)
    const mapSelectBg = this.add.rectangle(0, -70, buttonWidth, 48, 0x1a1a1a, 0.95).setStrokeStyle(2, 0xaaddaa)
    this.mapValueText = this.add.text(-buttonWidth / 2 + 20, -70, this.selectedMap, { font: '18px monospace', color: '#fff' }).setOrigin(0, 0.5)
    const mapSelectArrow = this.add.text(buttonWidth / 2 - 24, -70, 'v', { font: '18px monospace', color: '#aaddaa' }).setOrigin(0.5)
    mapSelectBg.setInteractive({ useHandCursor: true })
    this.mapValueText.setInteractive({ useHandCursor: true })
    mapSelectArrow.setInteractive({ useHandCursor: true })
    mapSelectBg.on('pointerdown', () => this.toggleMapOptions())
    this.mapValueText.on('pointerdown', () => this.toggleMapOptions())
    mapSelectArrow.on('pointerdown', () => this.toggleMapOptions())

    const newBtnBg = this.add.rectangle(0, 0, buttonWidth, buttonHeight, 0x222222, 0.9).setStrokeStyle(2, 0xffffff)
    const newBtnText = this.add.text(0, 0, 'New Game', { font: '20px monospace', color: '#fff' }).setOrigin(0.5)
    newBtnBg.setInteractive({ useHandCursor: true })
    newBtnBg.on('pointerover', () => newBtnBg.setFillStyle(0x333344))
    newBtnBg.on('pointerout', () => newBtnBg.setFillStyle(0x222222, 0.9))
    newBtnBg.on('pointerdown', () => this.startGame())

    const restartBtnBg = this.add.rectangle(0, 68, buttonWidth, buttonHeight, 0x222222, 0.9).setStrokeStyle(2, 0xffffff)
    const restartBtnText = this.add.text(0, 68, 'Restart', { font: '20px monospace', color: '#fff' }).setOrigin(0.5)
    restartBtnBg.setInteractive({ useHandCursor: true })
    restartBtnBg.on('pointerover', () => restartBtnBg.setFillStyle(0x333344))
    restartBtnBg.on('pointerout', () => restartBtnBg.setFillStyle(0x222222, 0.9))
    restartBtnBg.on('pointerdown', () => this.restartGame())
    restartBtnBg.setVisible(false)
    restartBtnText.setVisible(false)

    this.mapOptionContainer = this.add.container(0, -18)
    this.mapOptionContainer.setVisible(false)
    const optionBg = this.add.rectangle(0, 0, buttonWidth, 128, 0x111111, 0.98).setStrokeStyle(2, 0x88bb88)
    const cityOption = this.createMapOption(-36, 'City')
    const forestOption = this.createMapOption(0, 'Forest')
    const desertOption = this.createMapOption(36, 'Desert')
    this.mapOptionContainer.add([optionBg, ...cityOption, ...forestOption, ...desertOption])

    menu.add([
      mapLabel,
      mapSelectBg,
      this.mapValueText,
      mapSelectArrow,
      newBtnBg,
      newBtnText,
      restartBtnBg,
      restartBtnText,
      this.mapOptionContainer
    ])

    this.restartBtnBg = restartBtnBg
    this.restartBtnText = restartBtnText

    const howToLeft = 40
    const howToTop = 280
    const howToWidth = 300
    const howToHeight = 340
    this.add.rectangle(howToLeft + howToWidth / 2, howToTop + howToHeight / 2, howToWidth, howToHeight, 0x000000, 0.75)
      .setStrokeStyle(2, 0x888888)
    this.add.text(howToLeft + 16, howToTop + 16, 'HOW TO PLAY', { font: 'bold 16px monospace', color: '#ffff99' })
    this.add.text(
      howToLeft + 16,
      howToTop + 44,
      `MOVEMENT & AIM:
WASD - Move around
Mouse - Aim direction

SHOOTING:
Left Click (hold) - Shoot
Requires gun + ammo

WEAPONS:
Pick up gun icons to equip
1/2 - Switch weapons
Ammo spawns after pickup
Health packs heal 20 HP

SPECIAL:
F - Toggle flashlight
ESC - Back to menu`,
      { font: '12px monospace', color: '#ddd', lineSpacing: 4 }
    )

    this.add.text(this.scale.width / 2, this.scale.height - 40, 'Click New Game to start', { font: '14px monospace', color: '#ccc' }).setOrigin(0.5)

    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer, currentlyOver: Phaser.GameObjects.GameObject[]) => {
      if (!this.mapOptionContainer.visible) return
      if (currentlyOver.length === 0) this.mapOptionContainer.setVisible(false)
    })
  }

  startGame() {
    this.mapOptionContainer.setVisible(false)
    this.scene.start('GameScene', { mapType: this.selectedMap })
    this.scene.start('UIScene')
    this.showRestart()
  }

  restartGame() {
    this.mapOptionContainer.setVisible(false)
    this.scene.stop('GameScene')
    this.scene.start('GameScene', { mapType: this.selectedMap })
    this.scene.start('UIScene')
    this.showRestart()
  }

  private showRestart() {
    if (this.restartBtnBg) this.restartBtnBg.setVisible(true)
    if (this.restartBtnText) this.restartBtnText.setVisible(true)
  }

  private toggleMapOptions() {
    this.mapOptionContainer.setVisible(!this.mapOptionContainer.visible)
  }

  private setSelectedMap(map: 'City' | 'Forest' | 'Desert') {
    this.selectedMap = map
    this.mapValueText.setText(map)
    this.mapOptionContainer.setVisible(false)
  }

  private createMapOption(y: number, map: 'City' | 'Forest' | 'Desert') {
    const width = 276
    const bg = this.add.rectangle(0, y, width, 36, 0x244024, 0.9).setStrokeStyle(1, 0xaaddaa)
    const text = this.add.text(0, y, map, { font: '16px monospace', color: '#ffffff' }).setOrigin(0.5)
    bg.setInteractive({ useHandCursor: true })
    text.setInteractive({ useHandCursor: true })
    bg.on('pointerover', () => bg.setFillStyle(0x2d5a2d, 0.95))
    bg.on('pointerout', () => bg.setFillStyle(0x244024, 0.9))
    bg.on('pointerdown', () => this.setSelectedMap(map))
    text.on('pointerdown', () => this.setSelectedMap(map))
    return [bg, text]
  }
}
