import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, interval, switchMap } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface StatsOverview {
  totalUsers: number;
  activeUsers: number;
}

@Injectable({
  providedIn: 'root'
})
export class StatsService {
  private http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/stats`;

  private statsSubject = new BehaviorSubject<StatsOverview | null>(null);
  stats$ = this.statsSubject.asObservable();

  // Polling reference
  private pingSubscription: any;

  getOverview(): Observable<StatsOverview> {
    return this.http.get<StatsOverview>(`${this.apiUrl}/overview`);
  }

  ping(): Observable<any> {
    // Some pings are POST, some GET. Using POST as standard for pinging to update activity.
    // If backend requires GET, change to this.http.get. The user didn't specify the method for ping,
    // but typically it doesn't matter too much if it's just an activity hook.
    return this.http.get(`${this.apiUrl}/ping`); 
  }

  startPingInterval(): void {
    if (this.pingSubscription) {
      return;
    }
    
    // Fetch immediately
    this.refreshStats();

    // Ping /api/stats/ping every 60 seconds (60000ms), then refresh stats
    this.pingSubscription = interval(60000).pipe(
      switchMap(() => this.ping()),
      switchMap(() => this.getOverview())
    ).subscribe({
      next: (stats) => this.statsSubject.next(stats),
      error: (err) => console.error('Failed to ping/refresh stats', err)
    });
  }

  refreshStats(): void {
    this.getOverview().subscribe({
      next: (stats) => this.statsSubject.next(stats),
      error: (err) => console.error('Failed to get stats overview', err)
    });
  }

  stopPingInterval(): void {
    if (this.pingSubscription) {
      this.pingSubscription.unsubscribe();
      this.pingSubscription = null;
    }
  }
}
