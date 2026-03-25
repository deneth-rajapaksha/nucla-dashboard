import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./landing/landing.component').then((m) => m.LandingComponent),
  },
  {
    path: 'dashboard',
    loadComponent: () =>
      import('./dashboard-home/dashboard-home.component').then(
        (m) => m.DashboardHomeComponent
      ),
  },
  // Keep sidebar's "Articles" link functional without adding UI changes.
  {
    path: 'articles',
    redirectTo: '/dashboard',
    pathMatch: 'full',
  },
  {
    path: 'reactor',
    loadComponent: () =>
      import('./mini-reactor/mini-reactor-page.component').then(
        (m) => m.MiniReactorPageComponent
      ),
  },
  {
    path: 'quiz',
    loadComponent: () =>
      import('./quiz/quiz-game.component').then(
        (m) => m.QuizGameComponent
      ),
  },
  {
    path: 'leaderboard',
    loadComponent: () =>
      import('./features/leaderboard/leaderboard.component').then(
        (m) => m.LeaderboardComponent
      ),
  },
  {
    path: 'game',
    loadComponent: () =>
      import('./mini-game/radiation-runner.component').then(
        (m) => m.RadiationRunnerComponent
      ),
  },
  {
    path: 'profile',
    loadComponent: () =>
      import('./features/profile/profile.component').then(
        (m) => m.ProfileComponent
      ),
  },
  { path: '**', redirectTo: '' },
];
