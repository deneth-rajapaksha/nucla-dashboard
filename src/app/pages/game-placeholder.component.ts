import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-game-placeholder',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="space-y-4">
      <h2 class="text-2xl font-bold text-slate-800">Mini Game</h2>
      <p class="text-slate-600">Radiation exposure game placeholder.</p>
    </div>
  `,
})
export class GamePlaceholderComponent {}

