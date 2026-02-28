/*
  Game configuration (size, scenes, renderer settings)
*/
import Phaser from 'phaser'
import BootScene from '../scenes/BootScene'
import StartScene from '../scenes/StartScene'
import GameScene from '../scenes/GameScene'
import UIScene from '../scenes/UIScene'

export const ARENA_WIDTH = 2400
export const ARENA_HEIGHT = 2400

export const GAME_CONFIG: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  parent: 'game',
  width: 1280,
  height: 720,
  backgroundColor: '#111',
  scene: [BootScene, StartScene, GameScene, UIScene],
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH
  },
  physics: {
    default: 'arcade',
    arcade: {
      debug: false
    }
  }
}
