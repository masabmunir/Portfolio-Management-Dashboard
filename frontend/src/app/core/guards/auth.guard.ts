import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { TokenService } from '../services/token.service';

/**
 * Route guard: blocks navigation to protected routes if no access token exists.
 * Redirects to /login on failure.
 *
 * Note: This is a basic check. The real validation happens server-side on every
 * API call — if the token is expired, the error interceptor handles refresh/logout.
 */
export const authGuard: CanActivateFn = () => {
  const tokenService = inject(TokenService);
  const router = inject(Router);

  if (tokenService.hasAccessToken()) {
    return true;
  }

  router.navigate(['/login']);
  return false;
};