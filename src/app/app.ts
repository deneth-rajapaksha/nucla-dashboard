import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { SidebarComponent } from './sidebar';
import { TopbarComponent } from './topbar';
import { MatIconModule } from '@angular/material/icon';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-root',
  imports: [
    SidebarComponent,
    TopbarComponent,
    RouterOutlet,
    MatIconModule,
  ],
  template: `
    @if (isLandingRoute()) {
      <router-outlet />
    } @else {
      <div class="flex h-screen bg-slate-50 font-sans overflow-hidden relative">
        <!-- Hide sidebar on mobile -->
        <app-sidebar class="hidden md:flex z-30"></app-sidebar>
        
        <div class="flex-1 flex flex-col h-full overflow-hidden">
          <app-topbar></app-topbar>
          
          @if (isReactorRoute()) {
            <!-- Reactor: full bleed, scrollable, no footer -->
            <main class="flex-1 overflow-y-auto pb-24">
              <router-outlet />
            </main>
          } @else {
            <main class="flex-1 overflow-y-auto p-4 md:p-8 pb-32 flex flex-col">
              <div class="max-w-[1600px] mx-auto space-y-8 flex-1">
                <router-outlet />
              </div>
              
              <!-- Footer -->
              <footer class="mt-12 text-center py-6 text-slate-500 text-sm font-medium">
                Created with passion by FLUX team
              </footer>
            </main>
          }
        </div>

        <!-- Floating Nav Panel -->
        <div class="fixed bottom-6 left-1/2 -translate-x-1/2 bg-white/95 backdrop-blur-md shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-blue-100 rounded-full px-6 py-3 flex items-center gap-6 md:gap-8 z-50">
          <button (click)="navigate('/quiz')" class="text-slate-400 hover:text-blue-600 transition-colors flex flex-col items-center gap-1 group">
            <mat-icon class="group-hover:scale-110 transition-transform">quiz</mat-icon>
            <span class="text-[10px] font-bold uppercase tracking-wider hidden md:block">Quiz</span>
          </button>
          <button (click)="navigate('/dashboard')" class="text-slate-400 hover:text-blue-600 transition-colors flex flex-col items-center gap-1 group">
            <mat-icon class="group-hover:scale-110 transition-transform">article</mat-icon>
            <span class="text-[10px] font-bold uppercase tracking-wider hidden md:block">Article</span>
          </button>
          
          <!-- Center User Profile -->
          <div (click)="navigate('/profile')" class="w-12 h-12 md:w-16 md:h-16 rounded-full bg-gradient-to-tr from-blue-600 to-blue-400 p-1 shadow-lg shadow-blue-500/40 -mt-6 md:-mt-8 cursor-pointer hover:scale-105 transition-transform">
            <div class="w-full h-full bg-white rounded-full flex items-center justify-center text-blue-600">
              <mat-icon style="font-size: 24px; width: 24px; height: 24px;" class="md:!w-[32px] md:!h-[32px] md:!text-[32px]">person</mat-icon>
            </div>
          </div>

          <button (click)="navigate('/reactor')" class="text-slate-400 hover:text-blue-600 transition-colors flex flex-col items-center gap-1 group">
            <mat-icon class="group-hover:scale-110 transition-transform">science</mat-icon>
            <span class="text-[10px] font-bold uppercase tracking-wider hidden md:block">Reactor</span>
          </button>
          <button (click)="navigate('/game')" class="text-slate-400 hover:text-blue-600 transition-colors flex flex-col items-center gap-1 group">
            <mat-icon class="group-hover:scale-110 transition-transform">sports_esports</mat-icon>
            <span class="text-[10px] font-bold uppercase tracking-wider hidden md:block">Game</span>
          </button>
        </div>
      </div>
    }
  `,
  styles: []
})
export class App {
  private router = inject(Router);
  private url = signal(this.router.url);

  private readonly normalizedPath = computed(() => this.url().split('?')[0]);

  constructor() {
    this.router.events
      .pipe(filter((e): e is NavigationEnd => e instanceof NavigationEnd))
      .subscribe((e) => this.url.set(e.urlAfterRedirects));
  }

  isLandingRoute(): boolean {
    return this.normalizedPath() === '/';
  }

  isReactorRoute(): boolean {
    return this.normalizedPath() === '/reactor';
  }

  navigate(path: string) {
    this.router.navigateByUrl(path);
  }
}
