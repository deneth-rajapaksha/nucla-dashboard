import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, tap } from 'rxjs';
import { environment } from '../../../../environments/environment';

export interface UserProfile {
  firstName: string;
  lastName: string;
  age: number;
}

@Injectable({
  providedIn: 'root'
})
export class ProfileService {
  private http = inject(HttpClient);
  
  private readonly apiUrl = `${environment.apiUrl}/users/me`;
  
  private profileSubject = new BehaviorSubject<UserProfile | null>(null);
  profile$ = this.profileSubject.asObservable();

  getProfile(): Observable<UserProfile> {
    return this.http.get<UserProfile>(this.apiUrl).pipe(
      tap(profile => this.profileSubject.next(profile))
    );
  }

  updateProfile(data: UserProfile): Observable<UserProfile> {
    return this.http.put<UserProfile>(this.apiUrl, data).pipe(
      tap(profile => this.profileSubject.next(profile))
    );
  }
  
  clearProfile(): void {
    this.profileSubject.next(null);
  }
}
