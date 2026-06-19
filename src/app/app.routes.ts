import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { adminGuard } from './core/guards/role.guard';

export const routes: Routes = [
  { path: '', redirectTo: '/billing', pathMatch: 'full' },
  {
    path: 'login',
    loadComponent: () => import('./features/auth/login.component').then(m => m.LoginComponent)
  },
  {
    path: '',
    loadComponent: () => import('./shared/layout/layout.component').then(m => m.LayoutComponent),
    canActivate: [authGuard],
    children: [
      {
        path: 'dashboard',
        canActivate: [adminGuard],
        loadComponent: () => import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent)
      },
      {
        path: 'menu',
        loadComponent: () => import('./features/menu/menu.component').then(m => m.MenuComponent)
      },
      {
        path: 'menu/add',
        canActivate: [adminGuard],
        loadComponent: () => import('./features/menu/menu-form.component').then(m => m.MenuFormComponent)
      },
      {
        path: 'menu/edit/:id',
        canActivate: [adminGuard],
        loadComponent: () => import('./features/menu/menu-form.component').then(m => m.MenuFormComponent)
      },
      {
        path: 'customers',
        loadComponent: () => import('./features/customers/customers.component').then(m => m.CustomersComponent)
      },
      {
        path: 'users',
        canActivate: [adminGuard],
        loadComponent: () => import('./features/users/users.component').then(m => m.UsersComponent)
      },
      {
        path: 'billing',
        loadComponent: () => import('./features/billing/billing.component').then(m => m.BillingComponent)
      },
      {
        path: 'bills',
        loadComponent: () => import('./features/bill-history/bill-history.component').then(m => m.BillHistoryComponent)
      }
    ]
  },
  { path: '**', redirectTo: '/billing' }
];
