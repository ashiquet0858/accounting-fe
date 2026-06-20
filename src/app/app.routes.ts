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
      // Dashboard
      { path: 'dashboard', canActivate: [adminGuard],
        loadComponent: () => import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent) },

      // Menu
      { path: 'menu',
        loadComponent: () => import('./features/menu/menu.component').then(m => m.MenuComponent) },
      { path: 'menu/add', canActivate: [adminGuard],
        loadComponent: () => import('./features/menu/menu-form.component').then(m => m.MenuFormComponent) },
      { path: 'menu/edit/:id', canActivate: [adminGuard],
        loadComponent: () => import('./features/menu/menu-form.component').then(m => m.MenuFormComponent) },

      // Billing
      { path: 'billing',
        loadComponent: () => import('./features/billing/billing.component').then(m => m.BillingComponent) },

      // Bills
      { path: 'bills',
        loadComponent: () => import('./features/bill-history/bill-history.component').then(m => m.BillHistoryComponent) },
      { path: 'bills/:id',
        loadComponent: () => import('./features/bill-history/bill-detail.component').then(m => m.BillDetailComponent) },
      { path: 'bills/:id/edit',
        loadComponent: () => import('./features/bill-history/bill-edit.component').then(m => m.BillEditComponent) },
      { path: 'bills/:id/finalize',
        loadComponent: () => import('./features/bill-history/bill-finalize.component').then(m => m.BillFinalizeComponent) },

      // Tables
      { path: 'tables',
        loadComponent: () => import('./features/tables/tables.component').then(m => m.TablesComponent) },
      { path: 'tables/add', canActivate: [adminGuard],
        loadComponent: () => import('./features/tables/table-form.component').then(m => m.TableFormComponent) },
      { path: 'tables/edit/:id', canActivate: [adminGuard],
        loadComponent: () => import('./features/tables/table-form.component').then(m => m.TableFormComponent) },
      { path: 'tables/:id',
        loadComponent: () => import('./features/tables/table-detail.component').then(m => m.TableDetailComponent) },

      // Customers
      { path: 'customers',
        loadComponent: () => import('./features/customers/customers.component').then(m => m.CustomersComponent) },

      // Users (admin)
      { path: 'users', canActivate: [adminGuard],
        loadComponent: () => import('./features/users/users.component').then(m => m.UsersComponent) },
    ]
  },
  { path: '**', redirectTo: '/billing' }
];
