/*
  StartScene: main menu with a city-like background using generated building textures.
*/
import Phaser from 'phaser'
import { ARENA_WIDTH, ARENA_HEIGHT } from '../game/config'

export default class StartScene extends Phaser.Scene {
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
        s.setTint(Phaser.Display.Color.GetColor(200 + Phaser.Math.Between(-20, 20), 200 + Phaser.Math.Between(-20, 20), 200 + Phaser.Math.Between(-20, 20)))
        s.setScale(0.6 + Math.random() * 0.8)
        s.setRotation(Phaser.Math.FloatBetween(-0.05, 0.05))
        s.setDepth(-2)
      }
    }

    // title
    const title = this.add.text(this.scale.width / 2, 120, 'Top-Down Survival', { font: '36px monospace', color: '#ffffff' }).setOrigin(0.5)

    // menu container
    const menu = this.add.container(this.scale.width / 2, this.scale.height / 2)

    const buttonWidth = 300
    const buttonHeight = 56

    const newBtnBg = this.add.rectangle(0, -24, buttonWidth, buttonHeight, 0x222222, 0.9).setStrokeStyle(2, 0xffffff)
    const newBtnText = this.add.text(0, -24, 'New Game', { font: '20px monospace', color: '#fff' }).setOrigin(0.5)
    newBtnBg.setInteractive({ useHandCursor: true })
    newBtnBg.on('pointerover', () => newBtnBg.setFillStyle(0x333344))
    newBtnBg.on('pointerout', () => newBtnBg.setFillStyle(0x222222, 0.9))
    newBtnBg.on('pointerdown', () => this.startGame())

    const restartBtnBg = this.add.rectangle(0, 44, buttonWidth, buttonHeight, 0x222222, 0.9).setStrokeStyle(2, 0xffffff)
    const restartBtnText = this.add.text(0, 44, 'Restart', { font: '20px monospace', color: '#fff' }).setOrigin(0.5)
    restartBtnBg.setInteractive({ useHandCursor: true })
    restartBtnBg.on('pointerover', () => restartBtnBg.setFillStyle(0x333344))
    restartBtnBg.on('pointerout', () => restartBtnBg.setFillStyle(0x222222, 0.9))
    restartBtnBg.on('pointerdown', () => this.restartGame())

    menu.add([newBtnBg, newBtnText, restartBtnBg, restartBtnText])

    // footer
    const info = this.add.text(this.scale.width / 2, this.scale.height - 40, 'Click New Game to start', { font: '14px monospace', color: '#ccc' }).setOrigin(0.5)
  }

  startGame() {
    // start game and UI
    this.scene.start('GameScene')
    this.scene.start('UIScene')
  }

  restartGame() {
    // restart same as start: ensure fresh scene
    this.scene.stop('GameScene')
    this.scene.start('GameScene')
    this.scene.start('UIScene')
  }
}
