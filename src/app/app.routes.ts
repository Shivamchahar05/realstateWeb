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
        path: 'compare',
        loadComponent: () =>
          import('./pages/compare/compare.component').then((m) => m.CompareComponent),
      },
      {
        path: 'localities/:city/:locality',
        loadComponent: () =>
          import('./pages/locality/locality.component').then((m) => m.LocalityComponent),
      },
      {
        path: 'affordability',
        loadComponent: () =>
          import('./pages/tools/affordability.component').then((m) => m.AffordabilityComponent),
      },
      {
        path: 'stamp-duty',
        loadComponent: () =>
          import('./pages/tools/stamp-duty.component').then((m) => m.StampDutyComponent),
      },
      {
        path: 'price-insights',
        loadComponent: () =>
          import('./pages/tools/price-insights.component').then((m) => m.PriceInsightsComponent),
      },
      {
        path: 'about',
        data: { page: 'about' },
        loadComponent: () =>
          import('./pages/info/info-page.component').then((m) => m.InfoPageComponent),
      },
      {
        path: 'contact',
        data: { page: 'contact' },
        loadComponent: () =>
          import('./pages/info/info-page.component').then((m) => m.InfoPageComponent),
      },
      {
        path: 'privacy',
        data: { page: 'privacy' },
        loadComponent: () =>
          import('./pages/info/info-page.component').then((m) => m.InfoPageComponent),
      },
      {
        path: 'terms',
        data: { page: 'terms' },
        loadComponent: () =>
          import('./pages/info/info-page.component').then((m) => m.InfoPageComponent),
      },
      {
        path: 'blog',
        loadComponent: () =>
          import('./pages/blog/blog-list.component').then((m) => m.BlogListComponent),
      },
      {
        path: 'blog/:slug',
        loadComponent: () =>
          import('./pages/blog/blog-detail.component').then((m) => m.BlogDetailComponent),
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
        path: 'saved',
        canActivate: [authGuard],
        loadComponent: () =>
          import('./pages/saved/saved-homes.component').then((m) => m.SavedHomesComponent),
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
