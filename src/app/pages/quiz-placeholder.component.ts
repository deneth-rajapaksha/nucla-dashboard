import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-quiz-placeholder',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="space-y-4">
      <h2 class="text-2xl font-bold text-slate-800">Quiz</h2>
      <p class="text-slate-600">Leaderboard + quiz game placeholder.</p>
    </div>
  `,
})
export class QuizPlaceholderComponent {}

