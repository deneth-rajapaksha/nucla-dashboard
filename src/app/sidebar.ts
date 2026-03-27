import { Component, signal, Inject, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser, NgClass, CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { ProfileService, UserProfile } from './features/profile/services/profile.service';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [MatIconModule, NgClass, RouterLink, RouterLinkActive, CommonModule],
  template: `
    <div [ngClass]="isExpanded() ? 'w-64' : 'w-20'" class="bg-white border-r border-blue-100 h-full flex flex-col transition-all duration-300 relative z-40">
      <button (click)="toggle()" class="absolute -right-3 top-6 w-6 h-6 bg-white border border-blue-100 rounded-full flex items-center justify-center text-blue-600 shadow-sm hover:bg-blue-50 z-50">
        <mat-icon style="font-size: 16px; width: 16px; height: 16px;">{{ isExpanded() ? 'chevron_left' : 'chevron_right' }}</mat-icon>
      </button>
      
      <div class="p-6 flex items-center gap-3 overflow-hidden whitespace-nowrap">
        <div class="w-8 h-8 md:w-10 md:h-10 shrink-0">
          <img src="/favicon.ico" alt="NucLa Logo" class="w-full h-full object-contain" />
        </div>
        <h1 [ngClass]="isExpanded() ? 'opacity-100' : 'opacity-0 w-0'" class="text-2xl font-black text-slate-800 tracking-tight transition-all duration-300">NucLA</h1>
      </div>
      
      <nav class="flex-1 px-3 md:px-4 space-y-2 mt-4 overflow-x-hidden">
        <a routerLink="/dashboard" routerLinkActive="bg-blue-50 text-blue-600" [routerLinkActiveOptions]="{exact: true}" class="flex items-center gap-3 px-3 md:px-4 py-3 text-slate-600 hover:text-blue-600 hover:bg-blue-50/50 rounded-xl font-medium transition-colors whitespace-nowrap" title="Dashboard">
          <mat-icon class="shrink-0">dashboard</mat-icon>
          <span [ngClass]="isExpanded() ? 'opacity-100' : 'opacity-0 w-0 hidden'" class="transition-opacity duration-300">Dashboard</span>
        </a>
        <a routerLink="/articles" routerLinkActive="bg-blue-50 text-blue-600" class="flex items-center gap-3 px-3 md:px-4 py-3 text-slate-600 hover:text-blue-600 hover:bg-blue-50/50 rounded-xl font-medium transition-colors whitespace-nowrap" title="Articles">
          <mat-icon class="shrink-0">article</mat-icon>
          <span [ngClass]="isExpanded() ? 'opacity-100' : 'opacity-0 w-0 hidden'" class="transition-opacity duration-300">Articles</span>
        </a>
        <a routerLink="/reactor" routerLinkActive="bg-blue-50 text-blue-600" class="flex items-center gap-3 px-3 md:px-4 py-3 text-slate-600 hover:text-blue-600 hover:bg-blue-50/50 rounded-xl font-medium transition-colors whitespace-nowrap" title="Mini Reactor">
          <mat-icon class="shrink-0">science</mat-icon>
          <span [ngClass]="isExpanded() ? 'opacity-100' : 'opacity-0 w-0 hidden'" class="transition-opacity duration-300">Mini Reactor</span>
        </a>
        <a routerLink="/game" routerLinkActive="bg-blue-50 text-blue-600" class="flex items-center gap-3 px-3 md:px-4 py-3 text-slate-600 hover:text-blue-600 hover:bg-blue-50/50 rounded-xl font-medium transition-colors whitespace-nowrap" title="Mini Game">
          <mat-icon class="shrink-0">sports_esports</mat-icon>
          <span [ngClass]="isExpanded() ? 'opacity-100' : 'opacity-0 w-0 hidden'" class="transition-opacity duration-300">Mini Game</span>
        </a>
        <a routerLink="/quiz" routerLinkActive="bg-blue-50 text-blue-600" class="flex items-center gap-3 px-3 md:px-4 py-3 text-slate-600 hover:text-blue-600 hover:bg-blue-50/50 rounded-xl font-medium transition-colors whitespace-nowrap" title="Quiz">
          <mat-icon class="shrink-0">quiz</mat-icon>
          <span [ngClass]="isExpanded() ? 'opacity-100' : 'opacity-0 w-0 hidden'" class="transition-opacity duration-300">Quiz</span>
        </a>
        <a routerLink="/leaderboard" routerLinkActive="bg-blue-50 text-blue-600" class="flex items-center gap-3 px-3 md:px-4 py-3 text-slate-600 hover:text-blue-600 hover:bg-blue-50/50 rounded-xl font-medium transition-colors whitespace-nowrap" title="Leaderboard">
          <mat-icon class="shrink-0">leaderboard</mat-icon>
          <span [ngClass]="isExpanded() ? 'opacity-100' : 'opacity-0 w-0 hidden'" class="transition-opacity duration-300">Leaderboard</span>
        </a>
      </nav>
      
      <div class="p-3 md:p-4 mt-auto overflow-hidden">
        <div (click)="goToProfile()" class="bg-slate-50 rounded-xl p-2 border border-slate-100 flex items-center gap-3 whitespace-nowrap cursor-pointer" [ngClass]="{'md:p-4': isExpanded()}" *ngIf="profileService.profile$ | async as profile; else loadingProfile">
          <div class="w-8 h-8 md:w-10 md:h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold shrink-0 text-sm md:text-base">
            {{ getInitials(profile) }}
          </div>
          <div [ngClass]="isExpanded() ? 'opacity-100' : 'opacity-0 w-0 hidden'" class="transition-opacity duration-300">
            <p class="text-sm font-bold text-slate-800">{{ profile.firstName }} {{ profile.lastName }}</p>
            <p class="text-xs text-slate-500">Scientist</p>
          </div>
        </div>
        <ng-template #loadingProfile>
          <div (click)="goToProfile()" class="bg-slate-50 rounded-xl p-2 border border-slate-100 flex items-center gap-3 whitespace-nowrap cursor-pointer" [ngClass]="{'md:p-4': isExpanded()}">
            <div class="w-8 h-8 md:w-10 md:h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold shrink-0 text-sm md:text-base">
              SC
            </div>
            <div [ngClass]="isExpanded() ? 'opacity-100' : 'opacity-0 w-0 hidden'" class="transition-opacity duration-300">
              <p class="text-sm font-bold text-slate-800">Scientist</p>
              <p class="text-xs text-slate-500">Loading...</p>
            </div>
          </div>
        </ng-template>
      </div>
    </div>
  `
})
export class SidebarComponent {
  isExpanded = signal(true);
  private manualToggle = false;
  
  profileService = inject(ProfileService);
  
  constructor(
    @Inject(PLATFORM_ID) private platformId: Object,
    private router: Router,
  ) {
    if (isPlatformBrowser(this.platformId)) {
      this.checkWidth();
      window.addEventListener('resize', () => {
        if (!this.manualToggle) {
          this.checkWidth();
        }
      });
    }
  }

  private checkWidth() {
    this.isExpanded.set(window.innerWidth >= 1024);
  }

  toggle() {
    this.manualToggle = true;
    this.isExpanded.update(v => !v);
  }

  goToProfile() {
    this.router.navigateByUrl('/profile');
  }

  getInitials(profile: UserProfile): string {
    if (!profile) return 'SC';
    const first = profile.firstName ? profile.firstName.charAt(0).toUpperCase() : '';
    const last = profile.lastName ? profile.lastName.charAt(0).toUpperCase() : '';
    return `${first}${last}`;
  }
}
