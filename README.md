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
  - scenes/BootScene.ts, GameScene.ts, UIScene.ts
  - entities/Player.ts, Enemy.ts, Bullet.ts
  - systems/InputSystem.ts, SpawnerSystem.ts, CollisionSystem.ts, DifficultySystem.ts
  - utils/math.ts, constants.ts

How to extend

- Add new weapons: add a new system or extend `Player` to support variants.
- Add enemy types: extend `Enemy` and update `SpawnerSystem`.
- Add powerups: create new entities and spawn logic in `SpawnerSystem`.
