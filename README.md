# Top-Down Survival - Phaser + TypeScript + Vite

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

Testing

```bash
npm test
```

`vitest` runs the suite defined under `tests/` with a Node-based runner (`vitest.config.ts`). The folder currently covers:

- helpers: `math.test.ts` and `constants.test.ts` validate deterministic utilities/constants.
- systems: `difficulty.test.ts` exercises pacing logic, `collision.test.ts` ensures proximity callbacks trigger damage, and `spawner.test.ts` mocks Phaser math/random hooks to cover enemy type selection.

Additions to the suite should read from `tests/` and mock Phaser as needed; vitest already records Istanbul coverage when you run `npm test`.

Controls

- WASD: move
- Mouse: aim
- Left mouse (hold): shoot
- Esc: return to main menu (any time during play or when game over)
- 1 / 2: switch between pistol and shotgun when available (shotgun pickups appear after score >=100; shells spawn infrequently only once shotgun has been picked up)
- F: Flashlight beam follows cursor; world is darkened outside the cone
- Heavy enemies (red, more HP) begin appearing occasionally after score >=100
- Shooting enemies (blue) start spawning after score >=200 and fire a slow yellow projectile while the player is in aggro range

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

To Extend  
[x] Make player look different.  
[x] Make enemies look different.  
[x] Allow user to go back to main menu from the game.  
[x] Make ammo sprite look different.  
[x] Make weapon sprite look different.  
[x] Add new weapons: add a new system or extend `Player` to support variants.  
[ ] Fix rate of fire of different weapons  
[x] Add enemy types: extend `Enemy` and update `SpawnerSystem`.  
[ ] Add powerups: create new entities and spawn logic in `SpawnerSystem`.  
[x] Change the game back ground to a dark grey and buildings to a different color.  
[x] Add a "light" affect like a flash light.  
[x] Extend flash light and light affect to make map dark around player.  
[x] Bug: Ammo pick up before player has any weapons don't count towards pistol.  
[x] Add more random buildings with some lights in some of the windows.  
[x] Add a forest map.  
[x] Add a desert map.  
[x] Add health packs.  

Progress so far

- Start menu: `StartScene` with a city-like background and clickable `New Game` / `Restart` buttons.
- Generated textures and map layouts are created at boot; city buildings are static and block movement and bullets.
- Maps: city, forest, and desert. The desert is more open, includes loose sand that slows movement, and has one oasis with a ring of trees.
- Player: top down sprite, WASD movement, mouse aiming, health, brief invulnerability flash.
- Weapons and ammo: player starts with no weapon; `Weapon` pickups appear in the world (green icon), provide ammo; ammo pickups (small green boxes) also spawn periodically and at start.
- Health packs: one can exist at a time. It heals 20 HP, never above 100 HP, and another will not spawn for at least 20 seconds after pickup.
- Enemy drops: shooting enemies now have a chance to drop ammo (any type), a health pack, or nothing, keeping each encounter unpredictable.
- Shooting: bullets are physics objects that collide with buildings (destroyed) and overlap enemies to deal damage. Player can only shoot when equipped and with ammo; ammo is consumed per shot.
- Enemies: zombie-like behavior - idle/wander until player is within aggro radius, then seek. Enemies and player are blocked by buildings and tree trunks. Multiple enemies can swarm the player and deal continuous DPS.
- Heavy enemies (red) are slower but tankier and appear after score >=100.
- Shooting enemies (blue) appear after score >=200 and fire a single yellow shot about once per second when the player is close.
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
