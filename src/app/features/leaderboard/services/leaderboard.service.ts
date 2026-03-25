import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface LeaderboardEntry {
  rank: number;
  username: string;
  highestScore: number;
  attempts: number;
}

import { environment } from '../../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class LeaderboardService {
  private http = inject(HttpClient);
  
  private readonly apiUrl = `${environment.apiUrl}/quiz/leaderboard`;

  getLeaderboard(): Observable<LeaderboardEntry[]> {
    return this.http.get<LeaderboardEntry[]>(this.apiUrl);
  }
}
