# ☢ Banana Radiation Runner — Angular Component
description: `Bananas contain potassium, a tiny fraction of which is radioactive K-40. One banana = ~0.1 µSv. You'd need to eat 35 million bananas to get a lethal dose.`,
A fully playable educational runner game built as a standalone Angular component.
The monkey dodges real-world radiation sources while a live gauge tracks accumulated dose.
A detailed guide below the game explains how each source affects humans in real life.

---

## 📁 Files

```
radiation-runner/
├── radiation-runner.component.ts      ← Component class + game engine
├── radiation-runner.component.html    ← Template
├── radiation-runner.component.scss    ← Styles
└── README.md                          ← This file

assets/sprites/                        ← PUT YOUR SPRITE FILES HERE
├── happy-monkey.png   (37120 × 462 px, RGBA — 145 frames at 256px each)
├── sick-monkey.png    (37120 × 379 px, RGBA — 145 frames at 256px each)
└── background.jpg     (37120 × 379 px, RGB  — scrolling background)
```

---

## 🚀 Setup

### 1. Copy the component
Drop the four files into your Angular project, e.g.:
```
src/app/radiation-runner/
```

### 2. Copy the sprites
Place the three sprite files in:
```
src/assets/sprites/
```

### 3. Add to angular.json assets (if not already watching the assets folder)
```json
"assets": ["src/assets"]
```

### 4. Use in a parent component
```html
<!-- parent.component.html -->
<app-radiation-runner></app-radiation-runner>
```

```typescript
// parent.component.ts
import { RadiationRunnerComponent } from './radiation-runner/radiation-runner.component';

@Component({
  imports: [RadiationRunnerComponent],
  ...
})
```

### 5. Required Angular version
Angular 15+ (standalone components, `ChangeDetectionStrategy.OnPush`)

### 6. Required angular.json configuration
Ensure your project uses SCSS:
```json
"schematics": {
  "@schematics/angular:component": {
    "style": "scss"
  }
}
```

---

## 🎮 Game Mechanics

| Control | Action |
|---|---|
| `Space` / `↑` | Jump |
| `Click` / `Tap` | Jump |
| Double press | Double jump (mid-air) |

### Obstacle Types & Radiation Doses

| Obstacle | Dose | Spawn probability |
|---|---|---|
| 🍌 Banana | 0.1 µSv | 30% |
| 🚨 Smoke Detector | 0.09 µSv | 25% |
| ✈️ Flight (1 hr) | 3 µSv | 20% |
| 🦷 Dental X-ray | 5 µSv | 13% |
| 🏥 Chest X-ray | 100 µSv | 9% |
| ⚡ CT Scan | 700 µSv | 3% |

- Hit one → radiation added to gauge + burst animation
- Jump over one → +50 score + green flash
- Gauge 45%+ → monkey switches to sick green sprite
- Gauge 100% → death screen with full stats

---

## ⚙️ Customisation

All tweakable constants are in the `CONFIG` object at the top of the `.ts` file:

```typescript
const CONFIG = {
  CANVAS_W:          900,    // canvas width
  CANVAS_H:          379,    // canvas height
  TOTAL_FRAMES:      145,    // animation frames in sprite sheet
  FRAME_W:           256,    // source px per frame
  ANIM_FPS:          24,     // animation playback speed
  DISPLAY_H_HAPPY:   260,    // rendered happy monkey height
  DISPLAY_H_SICK:    210,    // rendered sick monkey height
  GRAVITY:           2000,   // px/s² — higher = snappier arc
  JUMP_VY:          -740,    // initial jump velocity (more negative = higher)
  DOUBLE_JUMP_VY:   -590,    // double jump strength
  BASE_SPEED:        300,    // px/s starting speed
  SPEED_INCR:        4,      // px/s added per second (difficulty ramp)
  MAX_SPEED:         720,    // px/s speed cap
  SICK_AT:           45,     // gauge % at which sick sprite activates
  MAX_DOSE:          3000,   // µSv at 100% gauge (death threshold)
};
```

Modify `OBSTACLE_TYPES` to add, remove or rebalance obstacles:

```typescript
const OBSTACLE_TYPES: ObstacleType[] = [
  {
    id: 'banana', emoji: '🍌', label: 'Banana',
    doseUv: 0.1, color: '#f9ca24', flashColor: 'rgba(249,202,36,0.45)', prob: 0.30,
  },
  // ... add your own here
];
```

Modify `GUIDE_ENTRIES` to add or edit educational cards below the game.

---

## 🛠 Asset Path Override

If your asset structure differs, update the `ASSET_PATHS` constant:

```typescript
const ASSET_PATHS = {
  HAPPY:  'assets/sprites/happy-monkey.png',
  SICK:   'assets/sprites/sick-monkey.png',
  BG:     'assets/sprites/background.jpg',
};
```

---

## 📊 Real-World Radiation Facts (used in the guide)

| Source | Dose |
|---|---|
| Natural background (annual) | 2,400 µSv |
| Banana | 0.1 µSv |
| Smoke detector (annual) | 0.09 µSv |
| Transatlantic flight (10 hr) | 60 µSv |
| Dental X-ray | 5 µSv |
| Chest X-ray | 100 µSv |
| CT scan (chest) | 7,000 µSv |
| ISS astronaut (6 months) | 80,000 µSv |
| Radiation sickness threshold | 1,000,000 µSv |
| Nuclear worker annual limit | 20,000 µSv |
