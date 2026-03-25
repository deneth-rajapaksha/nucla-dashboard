import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-profile-placeholder',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="space-y-4">
      <h2 class="text-2xl font-bold text-slate-800">Profile</h2>
      <p class="text-slate-600">User profile view placeholder.</p>
    </div>
  `,
})
export class ProfilePlaceholderComponent {}

