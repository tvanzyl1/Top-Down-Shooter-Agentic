/*
  GameScene: main gameplay loop. Manages entities, pools, camera, and systems.
*/
import Phaser from 'phaser'
import Player from '../entities/Player'
import Enemy, { HeavyEnemy } from '../entities/Enemy'
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

  // graphics for flashlight effect
  darkOverlay!: Phaser.GameObjects.Graphics
  lightMask!: Phaser.GameObjects.Graphics

  // flashlight runtime state
  flashEnabled = true
  // next time (ms) when a flicker may start
  nextFlickerAt = 0
  // flicker state
  isFlickering = false
  flickerStart = 0
  flickerDuration = 0

  constructor() {
    super({ key: 'GameScene' })
  }

  create() {
    // reset any leftover state when the scene is restarted or started after
    // being stopped. this ensures arrays from a previous playthrough don't
    // linger and cause `undefined` sprite errors.
    this.bullets = []
    this.enemies = []
    this.elapsed = 0
    this.score = 0
    this.isPaused = false

    // world bounds
    this.cameras.main.setBounds(0, 0, ARENA_WIDTH, ARENA_HEIGHT)
    this.physics.world.setBounds(0, 0, ARENA_WIDTH, ARENA_HEIGHT)
    // dark grey background so uncovered areas are visible through the flashlight
    this.cameras.main.setBackgroundColor(0x202020)

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
    // remove R-based restart, use menu button instead
    // returning to main menu with ESC (no pause / resume behaviour)
    this.input.keyboard.on('keydown-ESC', () => {
      this.scene.stop('GameScene')
      this.scene.stop('UIScene')
      this.scene.start('StartScene')
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
      // grant ammo according to type
      if (aref.type === 'Shotgun') {
        ;(this.player as any).shotgunAmmo += aref.amount
      } else {
        ;(this.player as any).pistolAmmo += aref.amount
      }
      if (a.destroy) a.destroy()
    })
    // create a few ammo pickups at start
    this.createAmmo(4)

    // flashlight graphics – overlay will be redrawn each frame
    this.darkOverlay = this.add.graphics()
    // sit on top of all game objects
    this.darkOverlay.setDepth(1000)
    // We'll draw the overlay and then erase the cone from it every frame.
    // No visible mask graphics are needed for the erase approach.

    // toggle flashlight with `F`
    this.input.keyboard.on('keydown-F', () => {
      this.flashEnabled = !this.flashEnabled
    })

    // schedule first possible flicker (6–10s)
    this.nextFlickerAt = this.time.now + Phaser.Math.Between(6000, 10000)

  }

  createBuildings(count: number) {
    this['buildings'] = this['buildings'] || []
    const buildingTextures = ['building-small', 'building-medium', 'building', 'building-large']
    const buildingSizes: { [key: string]: number } = {
      'building-small': 48,
      'building-medium': 80,
      'building': 128,
      'building-large': 160
    }
    const pad = 120
    for (let i = 0; i < count; i++) {
      let bx = Phaser.Math.Between(pad, ARENA_WIDTH - pad)
      let by = Phaser.Math.Between(pad, ARENA_HEIGHT - pad)
      const texture = Phaser.Utils.Array.GetRandom(buildingTextures)
      const buildingSize = buildingSizes[texture]
      let collidesWith = true
      let tries = 0

      // keep trying to find a spawn location until we find one that doesn't overlap
      while (collidesWith && tries < 50) {
        collidesWith = false
        bx = Phaser.Math.Between(pad, ARENA_WIDTH - pad)
        by = Phaser.Math.Between(pad, ARENA_HEIGHT - pad)

        // check if too close to player
        const dist = Phaser.Math.Distance.Between(bx, by, this.player.x, this.player.y)
        if (dist < 220) {
          const angle = Phaser.Math.FloatBetween(0, Math.PI * 2)
          bx = Phaser.Math.Clamp(this.player.x + Math.cos(angle) * 320, pad, ARENA_WIDTH - pad)
          by = Phaser.Math.Clamp(this.player.y + Math.sin(angle) * 320, pad, ARENA_HEIGHT - pad)
        }

        // check if overlaps with existing buildings
        const halfSize = buildingSize / 2
        const candidateBounds = {
          left: bx - halfSize,
          right: bx + halfSize,
          top: by - halfSize,
          bottom: by + halfSize
        }

        for (const existing of this['buildings']) {
          if (!existing || !existing.getBounds) continue
          const bb = existing.getBounds()
          // add padding for separation
          const padding = 16
          if (
            candidateBounds.left < bb.right + padding &&
            candidateBounds.right > bb.left - padding &&
            candidateBounds.top < bb.bottom + padding &&
            candidateBounds.bottom > bb.top - padding
          ) {
            collidesWith = true
            break
          }
        }

        tries++
      }

      // only spawn if we found a valid location
      if (!collidesWith) {
        const b = this.buildingsGroup.create(bx, by, texture) as Phaser.Physics.Arcade.Sprite
        b.setOrigin(0.5)
        b.setDepth(-1)
        this['buildings'].push(b)
      }
    }
  }

  // type: 'Pistol' (default) or 'Shotgun'
  createWeapons(count: number, type: string = 'Pistol') {
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
      const tex = type === 'Shotgun' ? 'shotgun' : 'weapon'
      const weapon = this.physics.add.sprite(wx, wy, tex) as Phaser.Physics.Arcade.Sprite
      weapon.setImmovable(true)
      const ammoAmt = type === 'Shotgun' ? 8 : 30
      weapon.setData('ref', { name: type, ammo: ammoAmt, destroy: () => weapon.destroy() })
      this.weaponsGroup.add(weapon)
      this['weapons'].push(weapon)
    }
  }

  // type: 'Pistol' or 'Shotgun'
  createAmmo(count: number, type: string = 'Pistol') {
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
      const tex = type === 'Shotgun' ? 'shell' : 'ammo'
      const amount = type === 'Shotgun' ? 5 : 10
      const ammo = this.physics.add.sprite(wx, wy, tex) as Phaser.Physics.Arcade.Sprite
      ammo.setImmovable(true)
      ammo.setData('ref', { amount, type })
      this.ammoGroup.add(ammo)
      this['ammos'].push(ammo)
    }
  }

  update(time: number, delta: number) {
    if (this.isPaused) return
    const dt = delta / 1000
    if (this.player.isDead) return

    // flashlight effect: darken world except cone from player toward pointer
    const cam = this.cameras.main
    const vw = cam.worldView.width
    const vh = cam.worldView.height
    // repaint overlay each frame
    this.darkOverlay.clear()
      const overlayAlpha = 0.6
      this.darkOverlay.fillStyle(0x000000, overlayAlpha)
      this.darkOverlay.fillRect(cam.worldView.x, cam.worldView.y, vw, vh)

      // determine whether the beam should be visible (handles toggle + flicker)
      let beamVisible = this.flashEnabled
      // start flicker occasionally (every ~6–10s)
      if (this.flashEnabled && !this.isFlickering && time >= this.nextFlickerAt) {
        this.isFlickering = true
        this.flickerStart = time
        this.flickerDuration = Phaser.Math.Between(100, 700) // short jitter burst
      }
      if (this.isFlickering) {
        const fe = time - this.flickerStart
        if (fe >= this.flickerDuration) {
          this.isFlickering = false
          this.nextFlickerAt = time + Phaser.Math.Between(6000, 10000)
        } else {
          // rapid on/off to simulate flicker (every ~80ms)
          beamVisible = (Math.floor(fe / 80) % 2) === 0
        }
      }

      if (beamVisible) {
        const px = this.player.x
        const py = this.player.y
        const pointer = this.input.activePointer
        const world = cam.getWorldPoint(pointer.x, pointer.y)
        const angle = Phaser.Math.Angle.Between(px, py, world.x, world.y)
        const len = (this.player as any).aggroRadius || 300
        const spread = Math.PI / 8

        // draw a core cone + two larger, lower-alpha cones to create soft edges
        this.darkOverlay.setBlendMode(Phaser.BlendModes.ERASE)
        // core is slightly transparent and outer cones create a soft feather
        const cones = [
          { mul: 1.0, alpha: 0.10 },
          { mul: 1.06, alpha: 0.05 },
          { mul: 1.14, alpha: 0.02 }
        ]
        for (const c of cones) {
          const l = len * c.mul
          this.darkOverlay.fillStyle(0xffffff, c.alpha)
          this.darkOverlay.beginPath()
          this.darkOverlay.moveTo(px, py)
          this.darkOverlay.lineTo(px + Math.cos(angle - spread) * l, py + Math.sin(angle - spread) * l)
          this.darkOverlay.lineTo(px + Math.cos(angle + spread) * l, py + Math.sin(angle + spread) * l)
          this.darkOverlay.closePath()
          this.darkOverlay.fillPath()
        }
        // restore normal blending for future drawings
        this.darkOverlay.setBlendMode(Phaser.BlendModes.NORMAL)
      }

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
      ,flashlight: this.flashEnabled
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

  // type may be 'normal' or 'heavy'
  spawnEnemy(x: number, y: number, type: string = 'normal') {
    let e: Enemy
    if (type === 'heavy') {
      e = new HeavyEnemy(this, x, y)
    } else {
      e = new Enemy(this, x, y)
    }
    this.enemies.push(e)
    if (e.sprite) this.enemiesGroup.add(e.sprite)
    return e
  }
}
