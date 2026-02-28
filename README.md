# Top-Down Survival — Phaser + TypeScript + Vite

Minimal top-down survival shooter MVP built with Phaser 3, TypeScript and Vite. Uses generated graphics (no external assets).

Setup

```bash
npm install
npm run dev
```

Build / Preview

```bash
npm run build
npm run preview
```

Controls

- WASD: move
- Mouse: aim
- Left mouse (hold): shoot
- Esc: pause/resume
- R: restart after Game Over

Project structure

- index.html
- vite.config.ts
- tsconfig.json
- src/
  - main.ts
  - game/config.ts
  - scenes/BootScene.ts, StartScene.ts, GameScene.ts, UIScene.ts
  - entities/Player.ts, Enemy.ts, Bullet.ts, Weapon.ts
  - systems/InputSystem.ts, SpawnerSystem.ts, CollisionSystem.ts, DifficultySystem.ts
  - utils/math.ts, constants.ts

How to extend

- Add new weapons: add a new system or extend `Player` to support variants.
- Add enemy types: extend `Enemy` and update `SpawnerSystem`.
- Add powerups: create new entities and spawn logic in `SpawnerSystem`.

Progress so far

- Start menu: `StartScene` with a city-like background and clickable `New Game` / `Restart` buttons.
- Generated building textures and city layout are created at boot; buildings are static and block movement and bullets.
- Player: triangle sprite, WASD movement, mouse aiming, health, brief invulnerability flash.
- Weapons & ammo: player starts with no weapon; `Weapon` pickups appear in the world (green icon), provide ammo; ammo pickups (small green boxes) also spawn periodically and at start.
- Shooting: bullets are physics objects that collide with buildings (destroyed) and overlap enemies to deal damage. Player can only shoot when equipped and with ammo; ammo is consumed per shot.
- Enemies: zombie-like behavior — idle/wander until player is within aggro radius, then seek. Enemies and player are blocked by buildings. Multiple enemies can swarm the player and deal continuous DPS.
- Systems: input, spawner (now avoids spawning inside buildings), collision, difficulty scaling over time.

Notes / next steps

- Object pooling can be added for bullets/enemies to reduce allocations.
- Add more weapon types, UI polish, audio, and persistent high score.

Files touched (key):

- [src/scenes/StartScene.ts](src/scenes/StartScene.ts)
- [src/scenes/BootScene.ts](src/scenes/BootScene.ts)
- [src/scenes/GameScene.ts](src/scenes/GameScene.ts)
- [src/scenes/UIScene.ts](src/scenes/UIScene.ts)
- [src/entities/Player.ts](src/entities/Player.ts)
- [src/entities/Enemy.ts](src/entities/Enemy.ts)
- [src/entities/Bullet.ts](src/entities/Bullet.ts)
- [src/entities/Weapon.ts](src/entities/Weapon.ts)
- [src/systems/InputSystem.ts](src/systems/InputSystem.ts)
- [src/systems/SpawnerSystem.ts](src/systems/SpawnerSystem.ts)
- [src/systems/CollisionSystem.ts](src/systems/CollisionSystem.ts)

