import { Injectable, inject, PLATFORM_ID } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { isPlatformBrowser } from '@angular/common';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

export interface AuthResponse {
  token?: string;
  message?: string;
  user?: any; // Adjust if user object is returned
}

export interface LoginPayload {
  username?: string;
  password?: string;
}

export interface RegisterPayload {
  username?: string;
  firstName?: string;
  lastName?: string;
  age?: number;
  email?: string;
  password?: string; // Landing module doesn't ask for password explicitly? Let's assume it might or backend generates
}

export interface ForgotPasswordPayload {
  username?: string;
  email?: string;
}

export interface ChangePasswordPayload {
  oldPassword?: string;
  newPassword?: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private http = inject(HttpClient);
  private platformId = inject(PLATFORM_ID);
  private readonly apiUrl = `${environment.apiUrl}/auth`;
  private readonly TOKEN_KEY = 'auth_token';

  register(data: RegisterPayload): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/register`, data);
  }

  login(data: LoginPayload): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/login`, data);
  }

  logout(): Observable<any> {
    // Some backends require a call to invalidate the session
    return this.http.post(`${this.apiUrl}/logout`, {});
  }

  forgotPassword(data: ForgotPasswordPayload): Observable<any> {
    return this.http.post(`${this.apiUrl}/fPassword`, data);
  }

  changePassword(data: ChangePasswordPayload): Observable<any> {
    return this.http.put(`${this.apiUrl}/password`, data);
  }

  // Token Management
  setToken(token: string): void {
    if (isPlatformBrowser(this.platformId)) {
      localStorage.setItem(this.TOKEN_KEY, token);
    }
  }

  getToken(): string | null {
    if (isPlatformBrowser(this.platformId)) {
      return localStorage.getItem(this.TOKEN_KEY);
    }
    return null;
  }

  clearToken(): void {
    if (isPlatformBrowser(this.platformId)) {
      localStorage.removeItem(this.TOKEN_KEY);
    }
  }

  isAuthenticated(): boolean {
    return !!this.getToken();
  }
}
