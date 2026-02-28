/*
  UIScene: heads-up display showing health, score, time, and game over overlay.
*/
import Phaser from 'phaser'

export default class UIScene extends Phaser.Scene {
  healthBar!: Phaser.GameObjects.Graphics
  healthText!: Phaser.GameObjects.Text
  scoreText!: Phaser.GameObjects.Text
  weaponText!: Phaser.GameObjects.Text
  timeText!: Phaser.GameObjects.Text
  flashlightText!: Phaser.GameObjects.Text
  overlay!: Phaser.GameObjects.Container

  constructor() {
    super({ key: 'UIScene', active: true })
  }

  create() {
    const { width } = this.scale

    this.healthBar = this.add.graphics()
    this.healthText = this.add.text(16, 16, 'HP: 100', { font: '16px monospace', color: '#fff' })
    this.weaponText = this.add.text(16, 64, 'Weapon: None (1/2)', { font: '14px monospace', color: '#fff' })
    this.flashlightText = this.add.text(16, 92, 'Flash: ON', { font: '14px monospace', color: '#0f0' })
    this.scoreText = this.add.text(width - 140, 16, 'Score: 0', { font: '16px monospace', color: '#fff' })
    this.timeText = this.add.text(width / 2 - 50, 8, '00:00', { font: '16px monospace', color: '#fff' })

    // overlay (hidden)
    this.overlay = this.add.container(width / 2, 200)
    const bg = this.add.rectangle(0, 0, 420, 180, 0x000000, 0.7)
    const title = this.add.text(-180, -60, 'Game Over', { font: '28px monospace', color: '#fff' })
    const info = this.add.text(-180, -10, '', { font: '16px monospace', color: '#fff' })
    // provide a hint about escaping to main menu
    const menuTip = this.add.text(-180, 40, 'Press Esc for menu', { font: '14px monospace', color: '#fff' })
    this.overlay.add([bg, title, info, menuTip])
    this.overlay.setVisible(false)

    this.game.events.on('hud:update', (data: any) => {
      this.updateHud(data)
    })

    this.game.events.on('game:over', (data: any) => {
      this.showGameOver(data)
    })
  }

  updateHud(data: { health: number; maxHealth: number; score: number; time: number; weapon?: string | null; ammo?: number }) {
    const { health, maxHealth, score, time, weapon, ammo } = data
    this.healthText.setText(`HP: ${Math.max(0, Math.floor(health))}`)
    this.scoreText.setText(`Score: ${score}`)
    const mm = String(Math.floor(time / 60)).padStart(2, '0')
    const ss = String(time % 60).padStart(2, '0')
    this.timeText.setText(`${mm}:${ss}`)

    this.weaponText.setText(`Weapon: ${weapon ? weapon : 'None'}  Ammo: ${ammo ?? 0}`)
    if ((data as any).flashlight !== undefined) {
      const on = (data as any).flashlight
      this.flashlightText.setText(`Flash: ${on ? 'ON' : 'OFF'}`)
      this.flashlightText.setColor(on ? '#0f0' : '#f44')
    }

    // simple bar
    this.healthBar.clear()
    this.healthBar.fillStyle(0x222222)
    this.healthBar.fillRect(16, 40, 200, 12)
    this.healthBar.fillStyle(0xff4444)
    const pct = Phaser.Math.Clamp(health / maxHealth, 0, 1)
    this.healthBar.fillRect(16, 40, 200 * pct, 12)
  }

  showGameOver(data: { score: number; time: number }) {
    const info = this.overlay.getAt(2) as Phaser.GameObjects.Text
    info.setText(`Score: ${data.score}\nTime: ${Math.floor(data.time / 60)}:${String(data.time % 60).padStart(2, '0')}`)
    this.overlay.setVisible(true)
  }
}
