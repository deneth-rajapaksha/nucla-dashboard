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
  {
    path: 'articles',
    loadComponent: () =>
      import('./articles/articles.component').then((m) => m.ArticlesComponent),
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
