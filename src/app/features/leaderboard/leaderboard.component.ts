import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { LeaderboardService, LeaderboardEntry } from './services/leaderboard.service';
import { Observable, catchError, of, map } from 'rxjs';

@Component({
  selector: 'app-leaderboard',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  templateUrl: './leaderboard.component.html',
  styleUrls: ['./leaderboard.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LeaderboardComponent {
  private leaderboardService = inject(LeaderboardService);

  // Expose the state to the template
  leaderboard$: Observable<{ data: LeaderboardEntry[] | null; error: string | null }> = this.leaderboardService.getLeaderboard().pipe(
    map(data => ({ data, error: null })),
    catchError(err => {
      console.error('Error fetching leaderboard:', err);
      return of({ data: null, error: 'Failed to load leaderboard data. Please try again later.' });
    })
  );

  getMedalColor(rank: number): string {
    switch (rank) {
      case 1: return '#FFD700'; // Gold
      case 2: return '#C0C0C0'; // Silver
      case 3: return '#CD7F32'; // Bronze
      default: return 'transparent';
    }
  }

  getRankClass(rank: number): string {
    switch (rank) {
      case 1: return 'rank-first';
      case 2: return 'rank-second';
      case 3: return 'rank-third';
      default: return 'rank-standard';
    }
  }
}
