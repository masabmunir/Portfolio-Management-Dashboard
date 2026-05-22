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
 * - Token persistence delegated to TokenService
 * - HTTP calls delegated to ApiService
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private api = inject(ApiService);
  private tokenService = inject(TokenService);
  private router = inject(Router);

  /**
   * Reactive current user state. Components can read this with currentUser()
   * and Angular will auto-update them when it changes.
   */
  private _currentUser = signal<User | null>(null);
  readonly currentUser = this._currentUser.asReadonly();
  readonly isAuthenticated = computed(() => this._currentUser() !== null);

  /**
   * Called once on app init to restore session if tokens exist in storage.
   * For simplicity, we trust the stored token without verification — the JWT
   * interceptor will catch invalid tokens on the next API call.
   */
  initializeFromStorage(): void {
    if (this.tokenService.hasAccessToken()) {
      // We don't have the user object stored — could decode JWT or fetch
      // profile. For this take-home, we mark as "logged in" placeholder.
      // First protected API call will give us real data.
      this._currentUser.set({ id: 'unknown', email: 'unknown' });
    }
  }

  register(request: RegisterRequest): Observable<AuthResponse> {
    return this.api.post<AuthResponse>('/auth/register', request).pipe(
      tap((response) => this.handleAuthSuccess(response)),
    );
  }

  login(request: LoginRequest): Observable<AuthResponse> {
    return this.api.post<AuthResponse>('/auth/login', request).pipe(
      tap((response) => this.handleAuthSuccess(response)),
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
    // Best-effort server-side logout. Don't block on it.
    if (refreshToken) {
      this.api.post('/auth/logout', { refreshToken }).subscribe({
        error: () => {
          // Swallow errors — user wants to log out, we'll force-clear locally.
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