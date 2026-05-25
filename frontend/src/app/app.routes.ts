import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./features/auth/login/login').then((m) => m.Login),
  },
  {
    path: 'register',
    loadComponent: () => import('./features/auth/register/register').then((m) => m.Register),
  },
  {
    path: '',
    canActivate: [authGuard],
    loadComponent: () => import('./features/layout/shell/shell').then((m) => m.Shell),
    children: [
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full',
      },
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./features/dashboard/dashboard').then((m) => m.Dashboard),
      },
      {
        path: 'portfolios',
        loadComponent: () =>
          import('./features/portfolios/portfolio-list/portfolio-list').then(
            (m) => m.PortfolioList,
          ),
      },
      {
        path: 'portfolios/:id',
        loadComponent: () =>
          import('./features/portfolios/portfolio-detail/portfolio-detail').then(
            (m) => m.PortfolioDetail,
          ),
      },
      {
        path: 'holdings/:id',
        loadComponent: () =>
          import('./features/holdings/holding-detail/holding-detail').then(
            (m) => m.HoldingDetail,
          ),
      },
    ],
  },
  {
    path: '**',
    redirectTo: 'dashboard',
  },
];