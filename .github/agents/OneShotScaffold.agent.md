Create a new Phaser 3 + TypeScript + Vite project in the current folder.

GOALS
- A top-down survival shooter MVP that runs in the browser.
- Mouse aim: player rotates/aims toward mouse pointer, shoots toward mouse on left click (hold to auto-fire).
- No Unity/editor-style drag and drop. Everything in code.
- Clean, scalable structure with separate files for entities/systems.
- Use simple generated graphics (Phaser graphics primitives) so there are no external image assets required.

TECH
- Use Vite + TypeScript.
- Use Phaser 3.
- Provide package.json scripts: dev, build, preview.
- Use strict-ish TypeScript (at least "strict": true if reasonable).

PROJECT STRUCTURE (required)
- index.html
- vite.config.ts
- tsconfig.json
- src/
  - main.ts
  - game/
    - config.ts
  - scenes/
    - BootScene.ts
    - GameScene.ts
    - UIScene.ts
  - entities/
    - Player.ts
    - Enemy.ts
    - Bullet.ts
  - systems/
    - InputSystem.ts
    - SpawnerSystem.ts
    - CollisionSystem.ts
    - DifficultySystem.ts
  - utils/
    - math.ts
    - constants.ts

GAMEPLAY REQUIREMENTS (MVP)
- World: fixed-size arena larger than the viewport (e.g., 2400x2400). Camera follows player.
- Player:
  - Represented by a simple triangle or rectangle + a small “barrel” line indicating facing direction.
  - WASD movement, with diagonal normalisation. Clamp within arena bounds.
  - Aims toward mouse pointer in world space (taking camera scroll into account).
  - Shoots bullets toward mouse when left mouse is down; includes fireRate (e.g., 6 shots/sec) and bullet speed.
  - Has health (e.g., 100). On enemy contact, takes damage over time (DPS) with brief invulnerability flash.
- Bullets:
  - Small circles/rectangles. Travel forward, lifetime limit, despawn when out of bounds.
  - Damage enemies (e.g., 25). Support multiple bullets.
- Enemies:
  - Spawn just outside camera view, around the player, but within arena bounds.
  - Move toward player (simple seek). Have health (e.g., 50). On death, add score and optionally drop XP orb (optional for MVP).
- Waves / difficulty:
  - Start easy and scale: increase spawn rate and enemy speed/health slowly over time.
  - Show elapsed survival time in UI.
- UI:
  - Top-left: Health bar + numeric health.
  - Top-right: Score.
  - Center-top: Time survived mm:ss.
  - Game Over overlay when health reaches 0: show score + time + “Press R to restart”.
- Controls:
  - WASD move.
  - Mouse aim.
  - Left click (hold) shoots.
  - R restarts after Game Over.
  - Esc pauses/resumes (basic pause toggle).

ENGINEERING REQUIREMENTS
- Avoid Phaser Arcade physics if not needed; but collision must be reliable. If you use Arcade Physics, keep it clean.
- Prefer composition: systems update entities each frame.
- Use object pooling for bullets and enemies OR implement a simple pooling approach to avoid constant allocations.
- Ensure delta time is used so movement is consistent.
- Include comments at the top of each file explaining its role.

DELIVERABLES
- Create all required files with complete code.
- Ensure `npm install` then `npm run dev` works.
- Include a README.md with:
  - Setup instructions
  - Controls
  - How to build/preview
  - How to extend (where to add new weapons/enemies)

When finished, output a brief summary of what was created and the commands to run.