import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ParticleSimulatorComponent } from '../particle-simulator';
import { ScienceFeedComponent } from '../science-feed';
import { ShortcutCardsComponent } from '../shortcut-cards';

@Component({
  selector: 'app-dashboard-home',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ParticleSimulatorComponent, ScienceFeedComponent, ShortcutCardsComponent],
  template: `
    <!-- Top Section: Simulator & Feed -->
    <div class="flex flex-col md:flex-row gap-6 md:gap-8 h-auto md:h-[500px]">
      <!-- Simulator takes priority in center/left -->
      <div class="w-full md:flex-1 h-[550px] md:h-full order-1">
        <app-particle-simulator></app-particle-simulator>
      </div>
      
      <!-- Articles on the right -->
      <div class="w-full md:w-80 lg:w-96 h-[400px] md:h-full order-2">
        <app-science-feed></app-science-feed>
      </div>
    </div>
    
    <!-- Bottom Section: Shortcuts -->
    <div class="order-3">
      <h2 class="text-lg font-bold text-slate-800 mb-4">Quick Actions</h2>
      <app-shortcut-cards></app-shortcut-cards>
    </div>
  `,
})
export class DashboardHomeComponent {}

