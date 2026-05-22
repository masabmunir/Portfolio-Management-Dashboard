import { Injectable, inject, signal, computed } from '@angular/core';
import { Observable, tap, BehaviorSubject } from 'rxjs';
import { Router } from '@angular/router';
import { ApiService } from './api.service';
import { TokenService } from './token.service';
import {
  User,
  AuthResponse,
  LoginRequest,
  RegisterRequest,
  RefreshTokenResponse,
} from '../models';

/**
 * Central auth state and API operations.
 * - Current user exposed as a Signal (modern Angular reactive primitive)
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private api = inject(ApiService);
  private tokenService = inject(TokenService);
  private router = inject(Router);

  /**
   * Reactive current user state. Components can read this with currentUser()
   */
  private _currentUser = signal<User | null>(null);
  readonly currentUser = this._currentUser.asReadonly();
  readonly isAuthenticated = computed(() => this._currentUser() !== null);

  /**
   * Called once on app init to restore session if tokens exist in storage.
   */
  initializeFromStorage(): void {
    if (this.tokenService.hasAccessToken()) {
      this._currentUser.set({ id: 'unknown', email: 'unknown' });
    }
  }

  register(request: RegisterRequest): Observable<AuthResponse> {
    return this.api.post<AuthResponse>('/auth/register', request).pipe(
      tap((response) => this.handleAuthSuccess(response)),
    );
  }

  login(request: LoginRequest): Observable<AuthResponse> {
  console.log('🚀 Login Request Payload:', request);

  return this.api.post<AuthResponse>('/auth/login', request).pipe(
    tap((response) => {
      console.log('✅ Login Success Response:', response);
      this.handleAuthSuccess(response);
    })
  );
}

  /**
   * Used by error interceptor to silently refresh on 401.
   * Returns new access token (NOT a full AuthResponse).
   */
  refresh(): Observable<RefreshTokenResponse> {
    const refreshToken = this.tokenService.getRefreshToken();
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }
    return this.api.post<RefreshTokenResponse>('/auth/refresh', { refreshToken }).pipe(
      tap((response) => this.tokenService.setAccessToken(response.accessToken)),
    );
  }

  logout(): void {
    const refreshToken = this.tokenService.getRefreshToken();
    if (refreshToken) {
      this.api.post('/auth/logout', { refreshToken }).subscribe({
        error: () => {
        },
      });
    }
    this.tokenService.clearTokens();
    this._currentUser.set(null);
    this.router.navigate(['/login']);
  }

  private handleAuthSuccess(response: AuthResponse): void {
    this.tokenService.setTokens(response.accessToken, response.refreshToken);
    this._currentUser.set(response.user);
  }
}