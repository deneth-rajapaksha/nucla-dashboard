import { Component } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-shortcut-cards',
  standalone: true,
  imports: [MatIconModule],
  template: `
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
      <!-- Chain Reaction -->
      <div class="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm flex flex-col items-center text-center relative">
        <div class="w-12 h-12 rounded-full bg-green-50 text-green-500 flex items-center justify-center mb-4">
          <mat-icon>bolt</mat-icon>
        </div>
        <span class="px-3 py-1 bg-green-50 text-green-600 text-[9px] font-bold uppercase rounded-full mb-3">Module 01</span>
        <h3 class="text-lg font-black text-slate-900 mb-2">Chain Reaction</h3>
        <p class="text-xs text-gray-500 mb-8">Mastering the kinetics of heavy isotope splitting.</p>
        
        <div class="w-full mt-auto">
          <div class="flex justify-between text-[10px] font-bold text-green-500 mb-2">
            <span>CURRENT MASTERY</span>
            <span>85%</span>
          </div>
          <div class="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
            <div class="h-full bg-green-500 rounded-full" style="width: 85%"></div>
          </div>
        </div>
      </div>

      <!-- Fusion Fun Quiz -->
      <div class="bg-orange-50/30 rounded-3xl p-8 border border-orange-100 shadow-sm flex flex-col items-center text-center relative">
        <div class="absolute top-6 right-6 w-6 h-6 bg-gray-800 rounded-full flex items-center justify-center text-white">
          <mat-icon class="text-[12px] w-[12px] h-[12px]">lock</mat-icon>
        </div>
        <div class="w-12 h-12 rounded-full bg-orange-100 text-orange-500 flex items-center justify-center mb-4">
          <mat-icon>local_fire_department</mat-icon>
        </div>
        <span class="px-3 py-1 bg-white border border-orange-200 text-orange-500 text-[9px] font-bold uppercase rounded-full mb-3">Module 02</span>
        <h3 class="text-lg font-black text-slate-900 mb-2">Fusion Fun Quiz</h3>
        <p class="text-xs text-gray-500 mb-6 italic">Complete Fission to unlock.</p>
        
        <div class="w-full bg-white rounded-xl p-3 border border-orange-100 flex gap-3 text-left mb-4">
          <div class="w-12 h-12 rounded-lg bg-gray-800 flex-shrink-0 overflow-hidden">
            <img src="https://picsum.photos/seed/plasma/50/50" class="w-full h-full object-cover" referrerpolicy="no-referrer">
          </div>
          <div>
            <h4 class="text-[10px] font-bold text-slate-800">The Tokamak Principle</h4>
            <p class="text-[8px] text-gray-500 mt-1">Exploring the magnetic confinement of plasma at...</p>
            <span class="text-[8px] text-orange-500 font-bold mt-1 inline-block">Read more →</span>
          </div>
        </div>
        
        <div class="w-full py-2 border border-orange-200 rounded-lg text-orange-400 text-xs font-bold bg-white mt-auto">
          Locked Progression
        </div>
      </div>

      <!-- Nuclear Monkey -->
      <div class="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm flex flex-col items-center text-center relative">
        <div class="absolute top-6 right-6 w-6 h-6 bg-gray-400 rounded-full flex items-center justify-center text-white">
          <mat-icon class="text-[12px] w-[12px] h-[12px]">lock</mat-icon>
        </div>
        <div class="w-12 h-12 rounded-full bg-purple-50 text-purple-400 flex items-center justify-center mb-4">
          <mat-icon>science</mat-icon>
        </div>
        <span class="px-3 py-1 bg-white border border-purple-200 text-purple-400 text-[9px] font-bold uppercase rounded-full mb-3">Module 03</span>
        <h3 class="text-lg font-black text-slate-900 mb-2">Nuclear Monkey</h3>
        <p class="text-xs text-gray-400 mb-8">The ultimate reactor chaos stabilization test.</p>
        
        <div class="w-full py-2 bg-purple-50 rounded-lg text-purple-400 text-xs font-bold mt-auto">
          Level 3 Security Clearance
        </div>
      </div>
    </div>
  `
})
export class ShortcutCardsComponent {}
