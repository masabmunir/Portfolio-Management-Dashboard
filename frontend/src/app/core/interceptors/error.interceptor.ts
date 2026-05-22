import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, switchMap, throwError, BehaviorSubject, filter, take } from 'rxjs';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { TokenService } from '../services/token.service';


// State shared across concurrent interceptor calls
let isRefreshing = false;
const refreshSubject = new BehaviorSubject<string | null>(null);

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const tokenService = inject(TokenService);
  const router = inject(Router);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      // Only handle 401 on non-auth endpoints
      const isAuthEndpoint =
        req.url.includes('/auth/login') ||
        req.url.includes('/auth/register') ||
        req.url.includes('/auth/refresh');

      if (error.status !== 401 || isAuthEndpoint) {
        return throwError(() => error);
      }

      // 401 on a protected endpoint — try to refresh
      if (isRefreshing) {
        // Another request is already refreshing — wait for it
        return refreshSubject.pipe(
          filter((token) => token !== null),
          take(1),
          switchMap((token) => {
            const retryReq = req.clone({
              setHeaders: { Authorization: `Bearer ${token}` },
            });
            return next(retryReq);
          }),
        );
      }

      // Start refresh
      isRefreshing = true;
      refreshSubject.next(null);

      return authService.refresh().pipe(
        switchMap((response) => {
          isRefreshing = false;
          refreshSubject.next(response.accessToken);

          // Retry original request with new token
          const retryReq = req.clone({
            setHeaders: { Authorization: `Bearer ${response.accessToken}` },
          });
          return next(retryReq);
        }),
        catchError((refreshError) => {
          // Refresh failed — force logout
          isRefreshing = false;
          tokenService.clearTokens();
          router.navigate(['/login']);
          return throwError(() => refreshError);
        }),
      );
    }),
  );
};