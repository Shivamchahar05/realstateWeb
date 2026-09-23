import { Routes } from '@angular/router';
import { authGuard } from './core/auth/auth.guard';
import { buyerGuard, sellerGuard } from './core/auth/seller.guard';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./layout/shell/shell.component').then((m) => m.ShellComponent),
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./pages/home/home.component').then((m) => m.HomeComponent),
      },
      {
        path: 'browse',
        loadComponent: () =>
          import('./pages/browse/browse.component').then((m) => m.BrowseComponent),
      },
      {
        path: 'properties/:id',
        loadComponent: () =>
          import('./pages/property-detail/property-detail.component').then(
            (m) => m.PropertyDetailComponent,
          ),
      },
      {
        path: 'login',
        loadComponent: () =>
          import('./pages/login/login.component').then((m) => m.LoginComponent),
      },
      {
        path: 'register',
        loadComponent: () =>
          import('./pages/register/register.component').then((m) => m.RegisterComponent),
      },
      {
        path: 'account',
        canActivate: [authGuard],
        loadComponent: () =>
          import('./pages/account/account.component').then((m) => m.AccountComponent),
      },
      {
        path: 'my-requests',
        canActivate: [buyerGuard],
        loadComponent: () =>
          import('./pages/my-requests/my-requests.component').then((m) => m.MyRequestsComponent),
      },
      {
        path: 'seller/properties',
        canActivate: [sellerGuard],
        loadComponent: () =>
          import('./pages/seller/property-list/property-list.component').then(
            (m) => m.PropertyListComponent,
          ),
      },
      {
        path: 'seller/properties/new',
        canActivate: [sellerGuard],
        loadComponent: () =>
          import('./pages/seller/property-form/property-form.component').then(
            (m) => m.PropertyFormComponent,
          ),
      },
      {
        path: 'seller/properties/:id/edit',
        canActivate: [sellerGuard],
        loadComponent: () =>
          import('./pages/seller/property-form/property-form.component').then(
            (m) => m.PropertyFormComponent,
          ),
      },
      {
        path: 'seller/properties/:id',
        canActivate: [sellerGuard],
        loadComponent: () =>
          import('./pages/seller/property-detail/property-detail.component').then(
            (m) => m.PropertyDetailComponent,
          ),
      },
    ],
  },
  { path: '**', redirectTo: '' },
];
