/*
  GameScene: main gameplay loop. Manages entities, pools, camera, and systems.
*/
import Phaser from 'phaser'
import Player from '../entities/Player'
import Enemy from '../entities/Enemy'
import Bullet from '../entities/Bullet'
import InputSystem from '../systems/InputSystem'
import SpawnerSystem from '../systems/SpawnerSystem'
import CollisionSystem from '../systems/CollisionSystem'
import DifficultySystem from '../systems/DifficultySystem'
import { ARENA_WIDTH, ARENA_HEIGHT } from '../game/config'

export default class GameScene extends Phaser.Scene {
  player!: Player
  bullets: Bullet[] = []
  enemies: Enemy[] = []
  buildingsGroup!: Phaser.Physics.Arcade.StaticGroup
  enemiesGroup!: Phaser.Physics.Arcade.Group
  bulletsGroup!: Phaser.Physics.Arcade.Group
  weaponsGroup!: Phaser.Physics.Arcade.Group
  ammoGroup!: Phaser.Physics.Arcade.Group
  inputSystem!: InputSystem
  spawner!: SpawnerSystem
  collision!: CollisionSystem
  difficulty!: DifficultySystem
  elapsed = 0
  score = 0
  isPaused = false

  constructor() {
    super({ key: 'GameScene' })
  }

  create() {
    // world bounds
    this.cameras.main.setBounds(0, 0, ARENA_WIDTH, ARENA_HEIGHT)
    this.physics.world.setBounds(0, 0, ARENA_WIDTH, ARENA_HEIGHT)

    // create player in center
    this.player = new Player(this, ARENA_WIDTH / 2, ARENA_HEIGHT / 2)

    // physics groups
    this.buildingsGroup = this.physics.add.staticGroup()
    this.enemiesGroup = this.physics.add.group()
    this.bulletsGroup = this.physics.add.group()

    // generate simple buildings for atmosphere (use static group)
    this.createBuildings(70)

    // camera follows player sprite
    this.cameras.main.startFollow(this.player.sprite)

    // systems
    this.inputSystem = new InputSystem(this, this.player)
    this.spawner = new SpawnerSystem(this)
    this.collision = new CollisionSystem(this)
    this.difficulty = new DifficultySystem(this)

    // keys
    this.input.keyboard.on('keydown-R', () => {
      if (this.player.isDead) {
        this.scene.restart()
        this.scene.get('UIScene').scene.restart()
      }
    })

    this.input.keyboard.on('keydown-ESC', () => {
      this.isPaused = !this.isPaused
      this.scene.pause('UIScene')
      if (!this.isPaused) this.scene.resume('UIScene')
    })

    // physics colliders and overlaps
    this.physics.add.collider(this.player.sprite, this.buildingsGroup)
    this.physics.add.collider(this.enemiesGroup, this.buildingsGroup)
    this.physics.add.collider(this.player.sprite, this.enemiesGroup)
    this.physics.add.collider(this.enemiesGroup, this.enemiesGroup)

    // bullets collide with buildings -> destroy bullet
    this.physics.add.collider(this.bulletsGroup, this.buildingsGroup, (b: any) => {
      if (b && b.destroy) b.destroy()
    })

    // bullets overlap enemies -> damage enemy and destroy bullet
    this.physics.add.overlap(this.bulletsGroup, this.enemiesGroup, (bulletObj: any, enemyObj: any) => {
      if (bulletObj && bulletObj.getData) {
        const bRef = bulletObj.getData('ref')
        if (bRef) bRef.destroy()
        else if (bulletObj.destroy) bulletObj.destroy()
      }
      if (enemyObj && enemyObj.getData) {
        const eRef = enemyObj.getData('ref')
        if (eRef && eRef.takeDamage) eRef.takeDamage(25)
      }
    })

    // weapons pickup
    this.weaponsGroup = this.physics.add.group()
    this.physics.add.overlap(this.player.sprite, this.weaponsGroup, (p: any, w: any) => {
      if (!w || !w.getData) return
      const wref = w.getData('ref')
      if (!wref) return
      ;(this.player as any).equipWeapon(wref.name, wref.ammo)
      wref.destroy()
      if (w.destroy) w.destroy()
    })

    // spawn a weapon somewhere safe
    this.createWeapons(1)

    // ammo group and pickup
    this.ammoGroup = this.physics.add.group()
    this.physics.add.overlap(this.player.sprite, this.ammoGroup, (p: any, a: any) => {
      if (!a || !a.getData) return
      const aref = a.getData('ref')
      if (!aref) return
      // grant ammo
      ;(this.player as any).ammo += aref.amount
      if (a.destroy) a.destroy()
    })
    // create a few ammo pickups at start
    this.createAmmo(4)
  }

  createBuildings(count: number) {
    this['buildings'] = this['buildings'] || []
    const pad = 120
    for (let i = 0; i < count; i++) {
      let bx = Phaser.Math.Between(pad, ARENA_WIDTH - pad)
      let by = Phaser.Math.Between(pad, ARENA_HEIGHT - pad)
      // avoid spawning too close to player
      const dist = Phaser.Math.Distance.Between(bx, by, this.player.x, this.player.y)
      if (dist < 220) {
        // push further away
        const angle = Phaser.Math.FloatBetween(0, Math.PI * 2)
        bx = Phaser.Math.Clamp(this.player.x + Math.cos(angle) * 320, pad, ARENA_WIDTH - pad)
        by = Phaser.Math.Clamp(this.player.y + Math.sin(angle) * 320, pad, ARENA_HEIGHT - pad)
      }
      const b = this.buildingsGroup.create(bx, by, 'building') as Phaser.Physics.Arcade.Sprite
      b.setOrigin(0.5)
      b.setDepth(-1)
      this['buildings'].push(b)
    }
  }

  createWeapons(count: number) {
    this['weapons'] = this['weapons'] || []
    const pad = 80
    for (let i = 0; i < count; i++) {
      let wx = Phaser.Math.Between(pad, ARENA_WIDTH - pad)
      let wy = Phaser.Math.Between(pad, ARENA_HEIGHT - pad)
      // ensure not inside building
      let tries = 0
      const buildings = this['buildings'] || []
      while (tries < 20) {
        let collides = false
        for (const b of buildings) {
          if (!b || !b.getBounds) continue
          const bb = b.getBounds()
          if (wx > bb.left - 16 && wx < bb.right + 16 && wy > bb.top - 16 && wy < bb.bottom + 16) {
            collides = true
            break
          }
        }
        if (!collides) break
        wx = Phaser.Math.Between(pad, ARENA_WIDTH - pad)
        wy = Phaser.Math.Between(pad, ARENA_HEIGHT - pad)
        tries++
      }
      const weapon = this.physics.add.sprite(wx, wy, 'bullet') as Phaser.Physics.Arcade.Sprite
      weapon.setTint(0x88ff88)
      weapon.setImmovable(true)
      weapon.setData('ref', { name: 'Pistol', ammo: 30, destroy: () => weapon.destroy() })
      this.weaponsGroup.add(weapon)
      this['weapons'].push(weapon)
    }
  }

  createAmmo(count: number) {
    this['ammos'] = this['ammos'] || []
    const pad = 80
    for (let i = 0; i < count; i++) {
      let wx = Phaser.Math.Between(pad, ARENA_WIDTH - pad)
      let wy = Phaser.Math.Between(pad, ARENA_HEIGHT - pad)
      // ensure not inside building
      let tries = 0
      const buildings = this['buildings'] || []
      while (tries < 20) {
        let collides = false
        for (const b of buildings) {
          if (!b || !b.getBounds) continue
          const bb = b.getBounds()
          if (wx > bb.left - 16 && wx < bb.right + 16 && wy > bb.top - 16 && wy < bb.bottom + 16) {
            collides = true
            break
          }
        }
        if (!collides) break
        wx = Phaser.Math.Between(pad, ARENA_WIDTH - pad)
        wy = Phaser.Math.Between(pad, ARENA_HEIGHT - pad)
        tries++
      }
      const ammo = this.physics.add.sprite(wx, wy, 'ammo') as Phaser.Physics.Arcade.Sprite
      ammo.setImmovable(true)
      ammo.setData('ref', { amount: 10 })
      this.ammoGroup.add(ammo)
      this['ammos'].push(ammo)
    }
  }

  update(time: number, delta: number) {
    if (this.isPaused) return
    const dt = delta / 1000
    if (this.player.isDead) return

    this.elapsed += dt
    this.inputSystem.update(dt)
    this.spawner.update(dt)
    this.difficulty.update(dt)

    // update bullets
    for (let i = this.bullets.length - 1; i >= 0; i--) {
      const b = this.bullets[i]
      b.update(dt)
      if (b.isDead) {
        b.destroy()
        this.bullets.splice(i, 1)
      }
    }

    // update enemies
    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const e = this.enemies[i]
      e.update(dt)
      if (e.isDead) {
        e.destroy()
        this.enemies.splice(i, 1)
        this.score += 10
      }
    }

    // collision checks
    this.collision.update(dt)

    // broadcast UI (include weapon state)
    this.game.events.emit('hud:update', {
      health: this.player.health,
      maxHealth: this.player.maxHealth,
      score: this.score,
      time: Math.floor(this.elapsed),
      weapon: (this.player as any).weaponName || null,
      ammo: (this.player as any).ammo || 0
    })

    if (this.player.isDead) {
      this.game.events.emit('game:over', { score: this.score, time: Math.floor(this.elapsed) })
    }
  }

  spawnBullet(x: number, y: number, vx: number, vy: number) {
    const b = new Bullet(this, x, y, vx, vy)
    this.bullets.push(b)
    if (b.sprite) {
      this.bulletsGroup.add(b.sprite)
      // ensure physics body is enabled and velocity is applied
      const body: any = (b.sprite as any).body
      if (!body) {
        this.physics.world.enable(b.sprite)
      }
      if (b.sprite.setVelocity) b.sprite.setVelocity(vx, vy)
      else if ((b.sprite as any).body && (b.sprite as any).body.setVelocity) (b.sprite as any).body.setVelocity(vx, vy)
    }
    return b
  }

  spawnEnemy(x: number, y: number) {
    const e = new Enemy(this, x, y)
    this.enemies.push(e)
    if (e.sprite) this.enemiesGroup.add(e.sprite)
    return e
  }
}
