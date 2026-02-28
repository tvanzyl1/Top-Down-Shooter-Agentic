/*
  Entry point: creates Phaser game using config
*/
import Phaser from 'phaser'
import { GAME_CONFIG } from './game/config'

window.addEventListener('load', () => {
  new Phaser.Game(GAME_CONFIG)
})
