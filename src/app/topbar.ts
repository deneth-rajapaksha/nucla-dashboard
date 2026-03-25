import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { Router } from '@angular/router';
import { ProfileService } from './features/profile/services/profile.service';
import { StatsService } from './core/services/stats.service';
import { AuthService } from './features/auth/services/auth.service';

@Component({
  selector: 'app-topbar',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  template: `
    <header class="h-20 bg-white border-b border-blue-100 px-4 md:px-8 flex items-center justify-between sticky top-0 z-20">
      <div class="flex items-center gap-4">
        <h2 class="text-lg md:text-xl font-bold text-slate-800">
          Welcome back, 
          <ng-container *ngIf="profileService.profile$ | async as profile">{{profile.firstName}} {{profile.lastName}}</ng-container>
          <ng-container *ngIf="(profileService.profile$ | async) === null">Scientist</ng-container>
        </h2>
      </div>
      
      <div class="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
        <div class="bg-blue-50 text-blue-700 px-3 py-1.5 md:px-4 md:py-2 rounded-full flex items-center gap-2 font-medium text-xs md:text-sm border border-blue-100 shadow-sm" *ngIf="statsService.stats$ | async as stats">
          <span class="relative flex h-2 w-2 md:h-3 md:w-3">
            <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
            <span class="relative inline-flex rounded-full h-2 w-2 md:h-3 md:w-3 bg-blue-500"></span>
          </span>
          <span class="hidden md:inline">{{ stats.activeUsers }} Scientists are online</span>
          <span class="md:hidden">{{ stats.activeUsers }} Online</span>
        </div>
      </div>

      <nav class="hidden lg:flex items-center gap-6">
        <button (click)="onLogout()" class="text-slate-500 hover:text-red-500 font-medium transition-colors flex items-center gap-2 cursor-pointer bg-transparent border-none p-0">
          <mat-icon style="font-size: 20px; width: 20px; height: 20px;">logout</mat-icon>
          Logout
        </button>
      </nav>
    </header>
  `
})
export class TopbarComponent implements OnInit, OnDestroy {
  profileService = inject(ProfileService);
  statsService = inject(StatsService);
  private authService = inject(AuthService);
  private router = inject(Router);

  ngOnInit() {
    this.profileService.getProfile().subscribe();
    this.statsService.startPingInterval();
  }

  ngOnDestroy() {
    this.statsService.stopPingInterval();
  }

  onLogout(): void {
    const doLogout = () => {
      this.authService.clearToken();
      this.router.navigate(['/']);
    };
    this.authService.logout().subscribe({
      next: doLogout,
      error: doLogout
    });
  }
}
