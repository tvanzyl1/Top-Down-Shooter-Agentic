/*
  GameScene: main gameplay loop. Manages entities, pools, camera, and systems.
*/
import Phaser from 'phaser'
import Player from '../entities/Player'
import Enemy, { HeavyEnemy, ShootingEnemy } from '../entities/Enemy'
import Bullet from '../entities/Bullet'
import InputSystem from '../systems/InputSystem'
import SpawnerSystem from '../systems/SpawnerSystem'
import CollisionSystem from '../systems/CollisionSystem'
import DifficultySystem from '../systems/DifficultySystem'
import { ARENA_WIDTH, ARENA_HEIGHT } from '../game/config'

export default class GameScene extends Phaser.Scene {
  mapType: 'city' | 'forest' | 'desert' = 'city'
  player!: Player
  bullets: Bullet[] = []
  enemies: Enemy[] = []
  trees: Phaser.GameObjects.Image[] = []
  swampZones: Phaser.Geom.Rectangle[] = []
  swampPatches: Phaser.GameObjects.Rectangle[] = []
  sandZones: Phaser.Geom.Rectangle[] = []
  sandPatches: Phaser.GameObjects.Rectangle[] = []
  oasisPatches: Phaser.GameObjects.Ellipse[] = []
  buildingsGroup!: Phaser.Physics.Arcade.StaticGroup
  treeTrunksGroup!: Phaser.Physics.Arcade.StaticGroup
  enemiesGroup!: Phaser.Physics.Arcade.Group
  bulletsGroup!: Phaser.Physics.Arcade.Group
  weaponsGroup!: Phaser.Physics.Arcade.Group
  ammoGroup!: Phaser.Physics.Arcade.Group
  healthPackGroup!: Phaser.Physics.Arcade.Group
  inputSystem!: InputSystem
  spawner!: SpawnerSystem
  collision!: CollisionSystem
  difficulty!: DifficultySystem
  elapsed = 0
  score = 0
  isPaused = false
  private dropChances = {
    ammo: 0.35,
    health: 0.25
  }

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

  init(data: { mapType?: string }) {
    if (data && data.mapType === 'Forest') this.mapType = 'forest'
    else if (data && data.mapType === 'Desert') this.mapType = 'desert'
    else this.mapType = 'city'
  }

  create() {
    // reset any leftover state when the scene is restarted or started after
    // being stopped. this ensures arrays from a previous playthrough don't
    // linger and cause `undefined` sprite errors.
    this.bullets = []
    this.enemies = []
    this.trees = []
    this.swampZones = []
    this.swampPatches = []
    this.sandZones = []
    this.sandPatches = []
    this.oasisPatches = []
    this['buildings'] = []
    this['weapons'] = []
    this['ammos'] = []
    this.elapsed = 0
    this.score = 0
    this.isPaused = false

    // world bounds
    this.cameras.main.setBounds(0, 0, ARENA_WIDTH, ARENA_HEIGHT)
    this.physics.world.setBounds(0, 0, ARENA_WIDTH, ARENA_HEIGHT)
    // darker green in the forest, sandy tan in the desert, grey in the city
    this.cameras.main.setBackgroundColor(this.mapType === 'forest' ? 0x18301c : this.mapType === 'desert' ? 0x8a7443 : 0x202020)

    // create player in center
    this.player = new Player(this, ARENA_WIDTH / 2, ARENA_HEIGHT / 2)

    // physics groups
    this.buildingsGroup = this.physics.add.staticGroup()
    this.treeTrunksGroup = this.physics.add.staticGroup()
    this.enemiesGroup = this.physics.add.group()
    this.bulletsGroup = this.physics.add.group()

    this.createMapLayout()

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
    this.physics.add.collider(this.player.sprite, this.treeTrunksGroup)
    this.physics.add.collider(this.enemiesGroup, this.buildingsGroup)
    this.physics.add.collider(this.enemiesGroup, this.treeTrunksGroup)
    this.physics.add.collider(this.player.sprite, this.enemiesGroup)
    this.physics.add.collider(this.enemiesGroup, this.enemiesGroup)

    // bullets collide with buildings -> destroy bullet
    this.physics.add.collider(this.bulletsGroup, this.buildingsGroup, (b: any) => {
      if (b && b.destroy) b.destroy()
    })
    this.physics.add.collider(this.bulletsGroup, this.treeTrunksGroup, (b: any) => {
      if (b && b.destroy) b.destroy()
    })

    this.physics.add.overlap(this.bulletsGroup, this.player.sprite, (bulletObj: any) => {
      if (!bulletObj || !bulletObj.getData) return
      const owner = bulletObj.getData('owner')
      if (owner !== 'enemy') return
      const bRef = bulletObj.getData('ref')
      if (bRef && bRef.damage) this.player.receiveDamage(bRef.damage)
      if (bRef && bRef.destroy) bRef.destroy()
      else if (bulletObj.destroy) bulletObj.destroy()
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

    // flashlight graphics – overlay will be redrawn each frame
    // health pack pickup
    this.healthPackGroup = this.physics.add.group()
    this.physics.add.overlap(this.player.sprite, this.healthPackGroup, (p: any, hp: any) => {
      if (!hp || !hp.getData) return
      const href = hp.getData('ref')
      if (!href) return
      const healed = this.player.heal(href.amount ?? 20)
      if (healed <= 0) return
      if (hp.destroy) hp.destroy()
      if (this.spawner) this.spawner.healthPackTimer = 20
    })

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

  createMapLayout() {
    if (this.mapType === 'forest') {
      this.createSwamps(45)
      this.createTrees(280)
      return
    }

    if (this.mapType === 'desert') {
      this.createLooseSand(24)
      this.createOasis()
      return
    }

    this.createBuildings(70)
    this.createTrees(110)
  }

  createLooseSand(count: number) {
    this.sandZones = []
    this.sandPatches = []
    const pad = 120

    for (let i = 0; i < count; i++) {
      let width = Phaser.Math.Between(130, 260)
      let height = Phaser.Math.Between(110, 210)
      let x = Phaser.Math.Between(pad, ARENA_WIDTH - pad)
      let y = Phaser.Math.Between(pad, ARENA_HEIGHT - pad)
      let tries = 0
      let valid = false

      while (tries < 20) {
        const rect = new Phaser.Geom.Rectangle(x - width / 2, y - height / 2, width, height)
        const tooCloseToPlayer = rect.contains(this.player.x, this.player.y)
        let overlaps = false

        for (const zone of this.sandZones) {
          if (Phaser.Geom.Intersects.RectangleToRectangle(rect, zone)) {
            overlaps = true
            break
          }
        }

        if (!tooCloseToPlayer && !overlaps) {
          valid = true
          break
        }

        width = Phaser.Math.Between(130, 260)
        height = Phaser.Math.Between(110, 210)
        x = Phaser.Math.Between(pad, ARENA_WIDTH - pad)
        y = Phaser.Math.Between(pad, ARENA_HEIGHT - pad)
        tries++
      }

      if (!valid) continue

      const zone = new Phaser.Geom.Rectangle(x - width / 2, y - height / 2, width, height)
      this.sandZones.push(zone)

      const patch = this.add.rectangle(x, y, width, height, 0xc39a5b, 0.3)
      patch.setDepth(-3)
      this.sandPatches.push(patch)

      const innerPatch = this.add.rectangle(
        x + Phaser.Math.Between(-20, 20),
        y + Phaser.Math.Between(-20, 20),
        Math.max(60, width * 0.6),
        Math.max(50, height * 0.6),
        0xd8b06a,
        0.2
      )
      innerPatch.setDepth(-3)
      this.sandPatches.push(innerPatch)
    }
  }

  createOasis() {
    const pad = 240
    let ox = Phaser.Math.Between(pad, ARENA_WIDTH - pad)
    let oy = Phaser.Math.Between(pad, ARENA_HEIGHT - pad)

    if (Phaser.Math.Distance.Between(ox, oy, this.player.x, this.player.y) < 260) {
      const angle = Phaser.Math.FloatBetween(0, Math.PI * 2)
      ox = Phaser.Math.Clamp(this.player.x + Math.cos(angle) * 420, pad, ARENA_WIDTH - pad)
      oy = Phaser.Math.Clamp(this.player.y + Math.sin(angle) * 420, pad, ARENA_HEIGHT - pad)
    }

    const shore = this.add.ellipse(ox, oy, 230, 150, 0xb89b5a, 0.45)
    shore.setDepth(-5)
    this.oasisPatches.push(shore)

    const grass = this.add.ellipse(ox, oy, 200, 130, 0x5c8a43, 0.28)
    grass.setDepth(-4)
    this.oasisPatches.push(grass)

    const water = this.add.ellipse(ox, oy, 170, 110, 0x2f9db1, 0.9)
    water.setDepth(-4)
    this.oasisPatches.push(water)

    const treeCount = Phaser.Math.Between(6, 9)
    for (let i = 0; i < treeCount; i++) {
      const angle = (Math.PI * 2 * i) / treeCount + Phaser.Math.FloatBetween(-0.22, 0.22)
      const radius = Phaser.Math.Between(85, 125)
      const tx = Phaser.Math.Clamp(ox + Math.cos(angle) * radius, 40, ARENA_WIDTH - 40)
      const ty = Phaser.Math.Clamp(oy + Math.sin(angle) * radius, 40, ARENA_HEIGHT - 40)
      this.spawnTreeAt(tx, ty)
    }
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

  createSwamps(count: number) {
    this.swampZones = []
    this.swampPatches = []
    const pad = 120

    for (let i = 0; i < count; i++) {
      let width = Phaser.Math.Between(110, 220)
      let height = Phaser.Math.Between(90, 180)
      let x = Phaser.Math.Between(pad, ARENA_WIDTH - pad)
      let y = Phaser.Math.Between(pad, ARENA_HEIGHT - pad)
      let tries = 0
      let valid = false

      while (tries < 20) {
        const rect = new Phaser.Geom.Rectangle(x - width / 2, y - height / 2, width, height)
        const tooCloseToPlayer = rect.contains(this.player.x, this.player.y)
        let overlaps = false

        for (const zone of this.swampZones) {
          if (Phaser.Geom.Intersects.RectangleToRectangle(rect, zone)) {
            overlaps = true
            break
          }
        }

        if (!tooCloseToPlayer && !overlaps) {
          valid = true
          break
        }

        width = Phaser.Math.Between(110, 220)
        height = Phaser.Math.Between(90, 180)
        x = Phaser.Math.Between(pad, ARENA_WIDTH - pad)
        y = Phaser.Math.Between(pad, ARENA_HEIGHT - pad)
        tries++
      }

      if (!valid) continue

      const zone = new Phaser.Geom.Rectangle(x - width / 2, y - height / 2, width, height)
      this.swampZones.push(zone)

      const patch = this.add.rectangle(x, y, width, height, 0x315f2f, 0.34)
      patch.setDepth(-3)
      this.swampPatches.push(patch)

      const innerPatch = this.add.rectangle(
        x + Phaser.Math.Between(-18, 18),
        y + Phaser.Math.Between(-18, 18),
        Math.max(48, width * 0.55),
        Math.max(40, height * 0.55),
        0x4d7f3b,
        0.22
      )
      innerPatch.setDepth(-3)
      this.swampPatches.push(innerPatch)
    }
  }

  createTrees(count: number) {
    this.trees = []
    const canopySize = 32
    const canopyHalf = canopySize / 2
    const pad = 48

    for (let i = 0; i < count; i++) {
      let tx = 0
      let ty = 0
      let blocked = true
      let tries = 0

      while (blocked && tries < 40) {
        blocked = false
        tx = Phaser.Math.Between(pad, ARENA_WIDTH - pad)
        ty = Phaser.Math.Between(pad, ARENA_HEIGHT - pad)

        const canopyBounds = {
          left: tx - canopyHalf,
          right: tx + canopyHalf,
          top: ty - canopyHalf,
          bottom: ty + canopyHalf
        }

        const buildings = this['buildings'] || []
        for (const building of buildings) {
          if (!building || !building.getBounds) continue
          const bb = building.getBounds()
          const padding = 12
          if (
            canopyBounds.left < bb.right + padding &&
            canopyBounds.right > bb.left - padding &&
            canopyBounds.top < bb.bottom + padding &&
            canopyBounds.bottom > bb.top - padding
          ) {
            blocked = true
            break
          }
        }

        if (blocked) {
          tries++
          continue
        }

        for (const existingTrunk of this.treeTrunksGroup.getChildren()) {
          if (!existingTrunk || !(existingTrunk as any).getBounds) continue
          const tb = (existingTrunk as any).getBounds()
          const padding = 18
          if (
            canopyBounds.left < tb.right + padding &&
            canopyBounds.right > tb.left - padding &&
            canopyBounds.top < tb.bottom + padding &&
            canopyBounds.bottom > tb.top - padding
          ) {
            blocked = true
            break
          }
        }

        tries++
      }

      if (!blocked) {
        const trunk = this.treeTrunksGroup.create(tx, ty + 8, 'tree-trunk') as Phaser.Physics.Arcade.Sprite
        trunk.setDepth(-1)
        trunk.setOrigin(0.5)

        const canopy = this.add.image(tx, ty - 6, 'tree-canopy')
        canopy.setDepth(5)
        this.trees.push(canopy)
      }
    }
  }

  spawnTreeAt(x: number, y: number) {
    const trunk = this.treeTrunksGroup.create(x, y + 8, 'tree-trunk') as Phaser.Physics.Arcade.Sprite
    trunk.setDepth(-1)
    trunk.setOrigin(0.5)

    const canopy = this.add.image(x, y - 6, 'tree-canopy')
    canopy.setDepth(5)
    this.trees.push(canopy)
  }

  isInsideObstacle(x: number, y: number, padding = 16) {
    const buildings = this['buildings'] || []
    for (const b of buildings) {
      if (!b || !b.getBounds) continue
      const bb = b.getBounds()
      if (x > bb.left - padding && x < bb.right + padding && y > bb.top - padding && y < bb.bottom + padding) {
        return true
      }
    }

    for (const trunk of this.treeTrunksGroup.getChildren()) {
      if (!trunk || !(trunk as any).getBounds) continue
      const tb = (trunk as any).getBounds()
      if (x > tb.left - padding && x < tb.right + padding && y > tb.top - padding && y < tb.bottom + padding) {
        return true
      }
    }

    return false
  }

  isInsideSwamp(x: number, y: number) {
    for (const zone of this.swampZones) {
      if (zone.contains(x, y)) return true
    }
    return false
  }

  isInsideLooseSand(x: number, y: number) {
    for (const zone of this.sandZones) {
      if (zone.contains(x, y)) return true
    }
    return false
  }

  getMovementSpeedMultiplier() {
    if (this.mapType === 'forest') return this.isInsideSwamp(this.player.x, this.player.y) ? 0.58 : 1
    if (this.mapType === 'desert') return this.isInsideLooseSand(this.player.x, this.player.y) ? 0.72 : 1
    return 1
  }

  // type: 'Pistol' (default) or 'Shotgun'
  createWeapons(count: number, type: string = 'Pistol') {
    this['weapons'] = this['weapons'] || []
    const pad = 80
    for (let i = 0; i < count; i++) {
      let wx = Phaser.Math.Between(pad, ARENA_WIDTH - pad)
      let wy = Phaser.Math.Between(pad, ARENA_HEIGHT - pad)
      // ensure not inside a blocking obstacle
      let tries = 0
      while (tries < 20) {
        if (!this.isInsideObstacle(wx, wy, 16)) break
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
      // ensure not inside a blocking obstacle
      let tries = 0
      while (tries < 20) {
        if (!this.isInsideObstacle(wx, wy, 16)) break
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

  createHealthPack() {
    if (this.healthPackGroup && this.healthPackGroup.countActive(true) > 0) return false

    const pad = 80
    let hx = Phaser.Math.Between(pad, ARENA_WIDTH - pad)
    let hy = Phaser.Math.Between(pad, ARENA_HEIGHT - pad)
    let tries = 0

    while (tries < 20) {
      if (!this.isInsideObstacle(hx, hy, 16)) break
      hx = Phaser.Math.Between(pad, ARENA_WIDTH - pad)
      hy = Phaser.Math.Between(pad, ARENA_HEIGHT - pad)
      tries++
    }

    const healthPack = this.physics.add.sprite(hx, hy, 'health-pack') as Phaser.Physics.Arcade.Sprite
    healthPack.setImmovable(true)
    healthPack.setData('ref', { amount: 20 })
    this.healthPackGroup.add(healthPack)
    return true
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
        if (e instanceof ShootingEnemy) {
          this.tryDropForShootingEnemy(e.sprite.x, e.sprite.y)
        }
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

  spawnBullet(
    x: number,
    y: number,
    vx: number,
    vy: number,
    texture: string = 'bullet',
    owner: 'player' | 'enemy' = 'player'
  ) {
    const b = new Bullet(this, x, y, vx, vy, texture, owner)
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
    } else if (type === 'shooter') {
      e = new ShootingEnemy(this, x, y)
    } else {
      e = new Enemy(this, x, y)
    }
    this.enemies.push(e)
    if (e.sprite) this.enemiesGroup.add(e.sprite)
    return e
  }

  private tryDropForShootingEnemy(x: number, y: number) {
    const roll = Phaser.Math.FloatBetween(0, 1)
    if (roll <= this.dropChances.ammo) {
      this.spawnDroppedAmmo(x, y)
    } else if (roll <= this.dropChances.ammo + this.dropChances.health) {
      this.spawnDroppedHealthPack(x, y)
    }
  }

  private spawnDroppedAmmo(x: number, y: number) {
    if (!this.ammoGroup) return
    const type = Phaser.Utils.Array.GetRandom(['Pistol', 'Shotgun'])
    const amount = type === 'Shotgun' ? 5 : 10
    const tex = type === 'Shotgun' ? 'shell' : 'ammo'
    const ammo = this.physics.add.sprite(x, y, tex) as Phaser.Physics.Arcade.Sprite
    ammo.setImmovable(true)
    ammo.setData('ref', { amount, type })
    this.ammoGroup.add(ammo)
  }

  private spawnDroppedHealthPack(x: number, y: number) {
    if (!this.healthPackGroup) return
    if (this.healthPackGroup.countActive(true) > 0) return
    const healthPack = this.physics.add.sprite(x, y, 'health-pack') as Phaser.Physics.Arcade.Sprite
    healthPack.setImmovable(true)
    healthPack.setData('ref', { amount: 20 })
    this.healthPackGroup.add(healthPack)
  }
}
