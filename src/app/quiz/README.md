# ⚛ Atomic Quiz Show — Angular Component

A retro-futuristic game show quiz with three particle hosts (Proton, Neutron, Electron),
10 levels, 50 MCQ questions, level timing, and backend integration hooks.

---

## Files

| File | Purpose |
|------|---------|
| `quiz-game.component.ts`   | Component logic, state management, API calls |
| `quiz-game.component.html` | Template / UI |
| `quiz-game.component.scss` | All styles (retro sci-fi theme) |
| `quiz-game.service.ts`     | API service with placeholder endpoints |

---

## Setup

### 1. Add to your Angular project

Copy all four files into a folder, e.g.:
```
src/app/quiz-game/
  ├── quiz-game.component.ts
  ├── quiz-game.component.html
  ├── quiz-game.component.scss
  └── quiz-game.service.ts
```

### 2. Add HttpClientModule

In your `app.config.ts` (standalone) or `app.module.ts`:
```ts
// Standalone (Angular 16+)
import { provideHttpClient } from '@angular/common/http';
export const appConfig = {
  providers: [provideHttpClient()]
};

// Module-based
import { HttpClientModule } from '@angular/common/http';
@NgModule({ imports: [HttpClientModule] })
```

### 3. Add fonts to index.html
```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700;900&family=Exo+2:wght@300;400;600;700&display=swap" rel="stylesheet">
```

### 4. Use the component
```html
<app-quiz-game></app-quiz-game>
```

---

## API Integration (replace placeholders in quiz-game.service.ts)

### Start Attempt — called on START button click
```
POST /api/quiz/attempt
Body: {}
Response: { attemptId: string, message: string }
```
→ Increments attempt counter in DB.

### Submit Quiz — called on SUBMIT button click
```
POST /api/quiz/submit
Body: {
  answers:    number[]  // 50 items; selected option index (0–3), -1 if skipped
  levelTimes: number[]  // 10 items; seconds taken per level
}
Response: {
  score:          number
  totalQuestions: number
  correctAnswers: number
  percentage:     number
  grade:          string
  message:        string
}
```
→ Backend calculates and returns score. Frontend displays result screen.

### To activate real API calls:
In `quiz-game.service.ts`:
1. Set `API_BASE` to your API URL.
2. Uncomment the `this.http.post(...)` lines.
3. Comment out or delete the mock `return of(...)` lines.

---

## Data Payload (console-logged on submit)
```json
{
  "answers":    [0,2,2,1,1, 2,0,2,2,2, ...],  // 50 values
  "levelTimes": [45, 62, 38, 71, 55, 48, 66, 43, 59, 77]  // 10 values (seconds)
}
```

---

## Customising Questions
Edit the `QUESTIONS` array in `quiz-game.service.ts`.
Each question:
```ts
{
  level:        number,           // 1–10
  host:         'proton' | 'neutron' | 'electron',
  question:     string,
  options:      [string, string, string, string],
  correctIndex: number            // 0–3 (used for PROTOTYPE scoring only)
}
```
> For production, remove `correctIndex` and score server-side only.
